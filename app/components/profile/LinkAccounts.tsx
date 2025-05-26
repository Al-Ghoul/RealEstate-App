import { Pressable, View, Text } from "react-native";
import { AccessToken, LoginManager } from "react-native-fbsdk-next";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { type LinkAccountDTO } from "@/lib/dtos";
import { useCallback } from "react";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import GoogleIcon from "../../assets/icons/google-logo.svg";
import { useUserAccounts } from "@/lib/queries/user";
import { useI18nContext } from "@/i18n/i18n-react";
import { toast } from "sonner-native";
import { isXiorError } from "xior";

export default function LinkAccounts() {
  const { LL } = useI18nContext();
  const accounts = useUserAccounts();
  const { mutateAsync: linkAccount, isPending: isLinkAccountPending } =
    useMutation({
      mutationFn: (data: LinkAccountDTO) =>
        xiorInstance.post("/auth/accounts/link", data).then((res) => res.data),
      onSuccess: (res) => toast.success(res.message),
      onError: (error) => {
        if (isXiorError(error)) {
          if (error.response?.data.requestId) {
            toast.warning(error.response?.data.message, {
              description: LL.REQUEST_ID({
                requestId: error.response?.data.requestId,
              }),
            });
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error(error.message);
        }
      },
    });

  const { mutateAsync: unLinkAccount, isPending: isUnLinkAccountPending } =
    useMutation({
      mutationFn: (data: { provider: string }) =>
        xiorInstance
          .delete(`/auth/accounts/unlink/${data.provider}`)
          .then((res) => res.data),
      onSuccess: (res) => toast.success(res.message),
      onError: (error) => {
        if (isXiorError(error)) {
          if (error.response?.data.requestId) {
            toast.warning(error.response?.data.message, {
              description: LL.REQUEST_ID({
                requestId: error.response?.data.requestId,
              }),
            });
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error(error.message);
        }
      },
    });

  const signInWithGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        linkAccount({
          provider: "google",
          idToken: response.data.idToken ?? "",
        }).then(() => {
          accounts.refetch();
        });
      } else {
        toast.warning(LL.SIGN_IN_WAS_CANCELLED());
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            toast.warning(LL.SIGN_IN_IS_IN_PROGRESS());
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            toast.warning(LL.GPLAY_SERVICE_NOT_AVAILABLE());
            break;
          default:
            toast.error(LL.AN_ERROR_OCCURRED_SIGNING_IN());
        }
      } else {

        toast.error(LL.AN_ERROR_OCCURRED_SIGNING_IN());
      }
    }
  }, [linkAccount, accounts]);

  return (
    <View
      style={{
        flexDirection: "row",
        marginTop: 8,
        gap: 8,
        marginHorizontal: "auto",
      }}
    >
      <Pressable
        style={{
          flexDirection: "row",
          backgroundColor: "#3b5998",
          paddingHorizontal: 20,
          gap: 10,
          height: 40,
          alignItems: "center",
          justifyContent: "space-around",
          borderRadius: 10,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,

          elevation: 5,
        }}
        disabled={isLinkAccountPending || isUnLinkAccountPending}
        onPress={() => {
          if (
            accounts.data?.find(
              (provider: { provider: string }) =>
                provider.provider === "facebook",
            )
          ) {
            unLinkAccount({
              provider: "facebook",
            }).then(() => accounts.refetch());
          } else {
            LoginManager.logInWithPermissions(["public_profile", "email"])
              .then((result) => {
                if (!result.isCancelled) {
                  AccessToken.getCurrentAccessToken().then((data) => {
                    linkAccount({
                      accessToken: data?.accessToken ?? "",
                      provider: "facebook",
                    }).then(() => accounts.refetch());
                  });
                }
              })
              .catch(() => toast.error(LL.AN_ERROR_OCCURRED_SIGNING_IN()));
          }
        }}
      >
        <FontAwesome5 name="facebook-f" size={20} color="#FFF" />
        <Text>
          {accounts.data?.find(
            (provider: { provider: string }) =>
              provider.provider === "facebook",
          )
            ? LL.UNLINK_ACCOUNT()
            : LL.LINK_ACCOUNT()}
        </Text>
      </Pressable>
      <Pressable
        style={{
          flexDirection: "row",
          backgroundColor: "#FFF",
          paddingHorizontal: 20,
          gap: 10,
          height: 40,
          alignItems: "center",
          justifyContent: "space-around",
          borderRadius: 10,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,

          elevation: 5,
        }}
        disabled={isLinkAccountPending || isUnLinkAccountPending}
        onPress={() => {
          if (
            accounts.data?.find(
              (provider: { provider: string }) =>
                provider.provider === "google",
            )
          ) {
            unLinkAccount({
              provider: "google",
            }).then(() => accounts.refetch());
          } else {
            signInWithGoogle();
          }
        }}
      >
        <GoogleIcon width={20} height={20} />
        <Text>
          {accounts.data?.find(
            (provider: { provider: string }) => provider.provider === "google",
          )
            ? LL.UNLINK_ACCOUNT()
            : LL.LINK_ACCOUNT()}
        </Text>
      </Pressable>
    </View>
  );
}
