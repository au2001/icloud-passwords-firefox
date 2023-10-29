export function autoFillPassword(username: string, password: string) {
  const warnings: string[] = [];

  let passwordInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      "input[autocomplete=current-password]",
    ),
  ).filter((input) => input.checkVisibility());

  if (passwordInputs.length === 0) {
    passwordInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[type=password]"),
    ).filter((input) => input.checkVisibility());
  }

  if (passwordInputs.length === 0) {
    throw "AUTO_FILL_NO_PASSWORD_FIELD";
  } else if (passwordInputs.length > 1) {
    warnings.push("AUTO_FILL_MULTIPLE_PASSWORD_FIELDS");
  }

  const passwordInput = passwordInputs[0];

  const isUsernameInput = (input: HTMLInputElement) => {
    if (!["text", "email", undefined].includes(input.type)) return false;
    if (!input.checkVisibility()) return false;

    const types = [
      "email",
      "e-mail",
      "mail",
      "username",
      "user",
      "login",
      "account",
    ];

    const fields = [
      input.autocomplete,
      input.name,
      input.id,
      input.className,
      input.placeholder,
      input.ariaLabel,
      input.getAttribute("ng-model"),
    ];

    return fields.some(
      (field) =>
        field && types.some((type) => field.toLowerCase().includes(type)),
    );
  };

  let usernameInput: Element | null = passwordInput;
  outer: do {
    if (usernameInput.lastElementChild !== null) {
      usernameInput = usernameInput.lastElementChild;
      continue;
    }

    while (usernameInput.previousElementSibling === null) {
      if (usernameInput.parentElement === null) {
        warnings.push("AUTO_FILL_NO_USERNAME_FIELD");
        usernameInput = null;
        break outer;
      }
      usernameInput = usernameInput.parentElement;
    }

    usernameInput = usernameInput.previousElementSibling;
  } while (
    usernameInput.tagName !== "INPUT" ||
    !(usernameInput instanceof HTMLInputElement) ||
    !isUsernameInput(usernameInput)
  );

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
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    nativeInputValueSetter?.call(input, value);

    input.dispatchEvent(new Event("change", { bubbles: true }));

    // Angular
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  };

  if (usernameInput !== null) setNativeValue(usernameInput, username);
  setNativeValue(passwordInput, password);

  return {
    success: true,
    warnings,
  };
}
