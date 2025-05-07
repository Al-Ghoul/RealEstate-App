import type { Translation } from "../i18n-types";

const ar = {
  WELCOME: "مرحبا {name}!",
  // BUTTONS & ETC
  LOGIN: "سجل الدخول",
  RESET: "أعد تعينها",
  REGISTER: "سجل",
  FORGOT_PASSWORD: "نسيت كلمة المرور؟",
  DONT_HAVE_ACCOUNT: "ليس لديك حساب؟",
  ALREADY_HAVE_AN_ACCOUNT: "لديك حساب بالفعل؟",
  OR: "أو",
  EMAIL: "البريد الإلكتروني",
  PASSWORD: "كلمة المرور",
  CONFIRM_PASSWORD: "تأكيد كلمة المرور",
  CURRENT_PASSWORD: "كلمة المرور الحالية",
  NEW_PASSWORD: "كلمة المرور الجديدة",
  FIRST_NAME: "الإسم الأول",
  LAST_NAME: "إسم العائلة",
  BIO: "نبذة",
  EDIT_PROFILE: "تعديل الملف الشخصي",
  CHANGE_PASSWORD: "تغيير كلمة المرور",
  SET_PASSWORD: "تعيين كلمة المرور",
  LOGOUT: "تسجيل الخروج",
  CHANGE_EMAIL: "تغيير البريد الإلكتروني",
  VERIFY: "تحقق",
  SAVE_CHANGES: "حفظ التغييرات",
  LINK_ACCOUNT: "ربط الحساب",
  UNLINK_ACCOUNT: "فصل الحساب",
  SEND_PASSWORD_RESET_CODE: "ارسل تعليمات استعادة كلمة المرور",
  CODE: "كود إعادة التعيين",
  CLOSE: "إغلاق",
  CANCEL: "إلغاء",
  ALREADY_RECEIVED_CODE: "استلمت كود بالفعل؟",
  UNSAVED_CHANGES: "لم يتم حفظ التغييرات",
  UNSAVED_CHANGES_PROMPT: "متأكد من انك تريد الخروج بدون حفظ التغييرات؟",
  DISCARD: "الخروج",
  EMAIL_NOT_VERIFIED: "لم يتم تأكيد البريد الإلكتروني",
  SEND_VERIFICATION_CODE: "ارسل تعليمات التحقق",
  SAVE_IMAGE: "حفظ الصورة",
  INVALID_CODE: "كود غير صحيح، يأتي الكود في هذه الصيغة: XXX-XXX",

  // ERRORS
  INVALID_EMAIL: "البريد الإلكتروني غير صحيح",
  PASSWORDS_DO_NOT_MATCH: "كلمة المرور غير متطابقة",
  INVALID_PASSWORD: "كلمة المرور غير صحيحة",
  PASSWORD_TOO_SHORT:
    "يجب علي كلمة المرور أن تتكون من {min} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أدني",
  FIRST_NAME_TOO_SHORT:
    "يجب علي الإسم الأول أن يتكون من {min} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أدني",
  FIRST_NAME_TOO_LONG:
    "يجب علي الإسم الأول أن يتكون من {max} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أقصي",
  LAST_NAME_TOO_SHORT:
    "يجب علي إسم العائلة أن يتكون من {min} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أدني",
  LAST_NAME_TOO_LONG:
    "يجب علي إسم العائلة أن يتكون من {max} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أقصي",
  CODE_IS_REQUIRED: "يرجى تقديم كود صالح",
  FIELD_IS_REQUIED: "هذا الحقل مطلوب",

  // SCREENS
  HOME: "الرئيسية",
  PROFILE: "الملف الشخصي",
} satisfies Translation;

export default ar;
