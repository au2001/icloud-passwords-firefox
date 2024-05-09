import { fillLoginForm, getLoginForms } from "../utils/dom";

declare global {
  interface Window {
    iCloudPasswordsFill: (
      username: string,
      password: string,
    ) => Promise<{ success: true; warnings: string[] }>;
  }
}

window.iCloudPasswordsFill = async (username, password) => {
  const warnings: string[] = [];

  const forms = getLoginForms();

  if (forms.length === 0) {
    throw new Error("AutoFill failed: no password field on page");
  } else if (forms.length > 1) {
    warnings.push(
      "Multiple passwords detected on page, only filling the first",
    );
  }

  warnings.push(...fillLoginForm(forms[0], username, password));

  return {
    success: true,
    warnings,
  };
};
