import type { BaseTranslation } from "../i18n-types";

const en = {
  // BUTTONS & ETC
  LOGIN: "Login",
  RESET: "Reset",
  REGISTER: "Register",
  FORGOT_PASSWORD: "Forgot password?",
  DONT_HAVE_ACCOUNT: "Don't have an account?",
  ALREADY_HAVE_AN_ACCOUNT: "Already have an account?",
  OR: "or",
  EMAIL: "Email",
  PASSWORD: "Password",
  CONFIRM_PASSWORD: "Confirm Password",
  CURRENT_PASSWORD: "Current Password",
  NEW_PASSWORD: "New Password",
  FIRST_NAME: "First Name",
  LAST_NAME: "Last Name",
  BIO: "Bio",
  EDIT_PROFILE: "Edit Profile",
  CHANGE_PASSWORD: "Change Password",
  SET_PASSWORD: "Set Password",
  LOGOUT: "Logout",
  CHANGE_EMAIL: "Change Email",
  VERIFY: "Verify",
  SAVE_CHANGES: "Save changes",
  LINK_ACCOUNT: "Link Account",
  UNLINK_ACCOUNT: "Unlink Account",
  SEND_PASSWORD_RESET_CODE: "Send Password Reset Code",
  CODE: "Code",
  CLOSE: "Close",
  CANCEL: "Cancel",
  ALREADY_RECEIVED_CODE: "Already received a code?",
  UNSAVED_CHANGES: "Unsaved changes",
  UNSAVED_CHANGES_PROMPT: "Are you sure you want to discard these changes?",
  DISCARD: "Discard",
  EMAIL_NOT_VERIFIED: "Email not verified",
  SEND_VERIFICATION_CODE: "Send Code",
  SAVE_IMAGE: "Save Image",
  INVALID_CODE: "Invalid code, the code must be in this form XXX-XXX",

  // ERRORS
  INVALID_EMAIL: "Invalid email",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
  PASSWORD_TOO_SHORT: "Password must be at least {min} character{{s}}",
  INVALID_PASSWORD: "Invalid password",
  FIRST_NAME_TOO_SHORT: "First name must be at least {min} character{{s}}",
  FIRST_NAME_TOO_LONG: "First name must be at most {max} character{{s}}",
  LAST_NAME_TOO_SHORT: "Last name must be at least {min} character{{s}}",
  LAST_NAME_TOO_LONG: "Last name must be at most {max} character{{s}}",
  CODE_IS_REQUIRED: "Please provide a valid code",
  FIELD_IS_REQUIED: "This field is required",

  // SCREENS
  HOME: "Home",
  PROFILE: "Profile",
} satisfies BaseTranslation;

export default en;
