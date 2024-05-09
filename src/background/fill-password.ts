import { getLoginForms } from "../utils/dom";

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

  // TODO: Fix outside function usage (https://stackoverflow.com/q/45817227)
  const forms = getLoginForms();

  if (forms.length === 0) {
    throw new Error("AutoFill failed: no password field on page");
  } else if (forms.length > 1) {
    warnings.push(
      "Multiple passwords detected on page, only filling the first",
    );
  }

  const { usernameInput, passwordInput } = forms[0];

  // Necessary for some JS libraries like React to detect the value correctly
  // See https://stackoverflow.com/a/46012210
  const setNativeValue = (input: HTMLInputElement, value: string) => {
    input.value = value;

    // React <= 15.5
    input.dispatchEvent(
      Object.assign(new InputEvent("input", { bubbles: true }), {
        simulated: true,
        value,
      }),
    );

    // React >= 15.6
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    nativeInputValueSetter?.call(input, value);

    input.dispatchEvent(new Event("change", { bubbles: true }));

    // Angular
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  };

  if (usernameInput !== null) setNativeValue(usernameInput, username);
  else warnings.push("No username field found on page");

  setNativeValue(passwordInput, password);

  return {
    success: true,
    warnings,
  };
};
