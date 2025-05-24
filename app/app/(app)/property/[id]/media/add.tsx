import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import {
  Button,
  Dialog,
  Portal,
  ProgressBar,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import PagerView from "react-native-pager-view";
import { useCallback, useRef, useState } from "react";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import Feather from "@expo/vector-icons/Feather";
import { useMutation } from "@tanstack/react-query";
import { router, Tabs, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import { useAuthStore } from "@/lib/stores/authStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { toast } from "sonner-native";
import { useI18nContext } from "@/i18n/i18n-react";
import { usePropertyMedia } from "@/lib/queries/property";

export default function AddPropertyMedia() {
  const params = useLocalSearchParams<{ id: string }>();
  const { id } = params;
  const theme = useTheme();
  const { LL } = useI18nContext();
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const uploadTasksRef = useRef<FileSystem.UploadTask[]>([]);
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const session = useAuthStore((state) => state.session);
  const { refetch: propertyMediaRefetch } = usePropertyMedia(parseInt(id));

  const backAction = useCallback(() => {
    if (isUploading) {
      setShowCancelDialog(true);
      return true;
    }
    router.push(`/property/${id}`);
    return false;
  }, [isUploading, id]);

  const cancelUploads = async () => {
    try {
      await Promise.all(
        uploadTasksRef.current.map((task) => task.cancelAsync()),
      );
      setIsUploading(false);
      setUploadProgress({});
      uploadTasksRef.current = [];
      setShowCancelDialog(false);
      router.push(`/property/${id}`);
    } catch {
      toast.error("Error cancelling uploads");
    }
  };

  const uploadMediaSequentially = useCallback(
    async (mediaItems: ImagePicker.ImagePickerAsset[]) => {
      setIsUploading(true);
      setCurrentUploadIndex(0);
      uploadTasksRef.current = [];

      try {
        for (let i = 0; i < mediaItems.length; i++) {
          const item = mediaItems[i];
          setCurrentUploadIndex(i);

          const uploadTask = FileSystem.createUploadTask(
            `${process.env.EXPO_PUBLIC_API_URL}/properties/${id}/media`,
            item.uri,
            {
              httpMethod: "POST",
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: "media",
              mimeType: item.mimeType,
              parameters: { id },
              headers: {
                Authorization: `Bearer ${session?.tokens?.accessToken}`,
              },
            },
            (progress) => {
              const percent =
                (progress.totalBytesSent / progress.totalBytesExpectedToSend) *
                100;
              console.log(`Upload progress: ${percent}%`);
              setUploadProgress((prev) => ({
                ...prev,
                [item.uri]: percent,
              }));
            },
          );

          uploadTasksRef.current.push(uploadTask);
          const res = await uploadTask.uploadAsync();

          if (res?.status === 401) propertyMediaRefetch();
          else if (res?.status !== 200)
            throw JSON.parse(res?.body!) as ErrorResponse;
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        setIsUploading(false);
        uploadTasksRef.current = [];
      }
    },
    [id, session?.tokens?.accessToken, propertyMediaRefetch],
  );

  const { mutateAsync: uploadMedia } = useMutation({
    mutationFn: uploadMediaSequentially,
    onSuccess: () => toast.success(LL.MEDIA_UPLOAD_SUCCESS()),
    onError: (error) => {
      if (typeof error === "object" && "requestId" in error) {
        toast.error(error.message, {
          description: LL.REQUEST_ID({ requestId: error.requestId }),
        });
      }
    },
  });

  const pickMultipleMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Media permission not granted");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8,
      orderedSelection: true,
    });

    if (!result.canceled) {
      setMedia((prev) => [...prev, ...result.assets]);
      const newProgress = result.assets.reduce(
        (acc, item) => {
          acc[item.uri] = 0;
          return acc;
        },
        {} as { [key: string]: number },
      );
      setUploadProgress(newProgress);
    }
  };

  const handleDelete = (item: ImagePicker.ImagePickerAsset) => {
    const newMedia = media.filter((m) => m.uri !== item.uri);
    const deletedIndex = media.findIndex((m) => m.uri === item.uri);

    if (deletedIndex <= currentPage) {
      const newPage = Math.max(0, currentPage - 1);
      setCurrentPage(newPage);
      pagerRef.current?.setPage(newPage);
    }

    setMedia(newMedia);
  };

  return (
    <>
      <Tabs.Screen
        options={{
          title: LL.ADD_PROPERTY_MEDIA(),
          headerLeft: () => (
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={backAction}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ),
          href: null,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingBottom: 16,
        }}
      >
        <Button
          mode="outlined"
          onPress={pickMultipleMedia}
          style={{ margin: 16 }}
          icon="image-plus"
        >
          {LL.ADD_PROPERTY_MEDIA()}
        </Button>

        {isUploading && (
          <View style={{ padding: 16 }}>
            <Text variant="bodyMedium">
              Uploading {currentUploadIndex + 1} of {media.length}
            </Text>
            <ProgressBar
              progress={
                (currentUploadIndex +
                  (uploadProgress[media[currentUploadIndex]?.uri] || 0) / 100) /
                media.length
              }
              color={theme.colors.primary}
              style={{ marginTop: 8 }}
            />
            <Text
              variant="bodySmall"
              style={{ textAlign: "center", marginTop: 4 }}
            >
              {uploadProgress[media[currentUploadIndex]?.uri] || 0}% complete
            </Text>
          </View>
        )}

        {media.length > 0 && (
          <>
            <PagerView
              ref={pagerRef}
              style={{ flex: 1 }}
              initialPage={0}
              onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
            >
              {media.map((item, index) => (
                <View key={index} style={{ flex: 1 }}>
                  <View style={styles.mediaHeader}>
                    <Text style={styles.mediaCounter}>
                      {index + 1} / {media.length}
                    </Text>
                    <TouchableRipple
                      onPress={() => handleDelete(item)}
                      style={styles.deleteButton}
                      borderless
                    >
                      <Feather
                        name="trash-2"
                        size={24}
                        color={theme.colors.error}
                      />
                    </TouchableRipple>
                  </View>

                  {item.type === "video" ? (
                    <VideoScreen videoSource={item.uri} />
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.media} />
                  )}
                </View>
              ))}
            </PagerView>

            <Button
              mode="contained"
              onPress={() =>
                uploadMedia(media).then(() => {
                  setMedia([]);
                  backAction();
                  propertyMediaRefetch();
                  router.push(`/property/${id}`);
                })
              }
              disabled={isUploading || media.length === 0}
              loading={isUploading}
              style={{ margin: 16 }}
            >
              {isUploading ? LL.UPLOADING_MEDIA() : LL.SAVE_MEDIA()}
            </Button>
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showCancelDialog}
          onDismiss={() => setShowCancelDialog(false)}
        >
          <Dialog.Title>Upload in Progress</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to cancel the upload and leave?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCancelDialog(false)}>
              Continue Upload
            </Button>
            <Button onPress={cancelUploads} textColor={theme.colors.error}>
              Cancel Upload
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function VideoScreen({ videoSource }: { videoSource: string }) {
  const player = useVideoPlayer(videoSource);

  return (
    <VideoView
      style={styles.video}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  mediaHeader: {
    flexDirection: "row",
    position: "absolute",
    width: "100%",
    justifyContent: "space-between",
    padding: 16,
    zIndex: 1,
  },
  mediaCounter: {
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "bold",
    padding: 8,
    borderRadius: 50,
  },
  deleteButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 50,
  },
  media: {
    flex: 1,
    backgroundColor: "black",
  },
});
