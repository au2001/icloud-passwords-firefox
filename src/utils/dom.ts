export interface LoginForm {
  usernameInput: HTMLInputElement | null;
  passwordInput: HTMLInputElement;
}

export const isUsernameInput = (input: HTMLInputElement) => {
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
    "autocomplete",
    "name",
    "id",
    "className",
    "placeholder",
    "aria-label",
    "ng-model",
  ];

  return fields.some((field) => {
    const value = input.getAttribute(field)?.toLowerCase();
    if (!value) return false;
    return types.some((type) => value.includes(type));
  });
};

export const getLoginForms = () => {
  let passwordInputs = [
    ...document.querySelectorAll<HTMLInputElement>(
      "input[autocomplete=current-password]",
    ),
  ].filter((input) => input.checkVisibility());

  if (passwordInputs.length === 0) {
    passwordInputs = [
      ...document.querySelectorAll<HTMLInputElement>("input[type=password]"),
    ].filter((input) => input.checkVisibility());
  }

  return passwordInputs.map<LoginForm>((passwordInput) => {
    let usernameInput: Element | null = passwordInput;
    let success = false;
    outer: do {
      if (usernameInput.lastElementChild !== null) {
        usernameInput = usernameInput.lastElementChild;
        continue;
      }

      while (usernameInput.previousElementSibling === null) {
        usernameInput = usernameInput.parentElement;
        if (usernameInput === null) break outer;
      }

      usernameInput = usernameInput.previousElementSibling;
    } while (
      usernameInput.tagName !== "INPUT" ||
      !(usernameInput instanceof HTMLInputElement) ||
      !(
        (success = isUsernameInput(usernameInput)) ||
        passwordInputs.includes(usernameInput)
      )
    );

    if (!success) usernameInput = null;

    return {
      usernameInput,
      passwordInput,
    };
  });
};
