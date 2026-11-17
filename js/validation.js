const feedbackForm = document.getElementById("feedbackForm");

if (!feedbackForm) {
  console.error('Форму з id="feedbackForm" не знайдено.');
} else {
  const username = feedbackForm.querySelector("#username");
  const email = feedbackForm.querySelector("#email");
  const phone = feedbackForm.querySelector("#phone");
  const message = feedbackForm.querySelector("#message");
  const agreement = feedbackForm.querySelector("#agreement");

  const fields = { username, email, phone, message, agreement };
  const missingFields = Object.entries(fields)
    .filter(([, field]) => !field)
    .map(([name]) => name);

  if (missingFields.length > 0) {
    console.error(`У формі не знайдено поля: ${missingFields.join(", ")}.`);
  } else {
    const phonePattern = /^\+380\d{9}$/;
    const interactedFields = new WeakSet();

    // Вимикаємо нативні підказки, щоб показувати власні повідомлення для всіх полів.
    feedbackForm.noValidate = true;

    function getErrorElement(field) {
      let errorElement = feedbackForm.querySelector(`#${field.id}-error`);

      if (!errorElement) {
        errorElement = document.createElement("p");
        errorElement.id = `${field.id}-error`;
        errorElement.className = "mt-1 text-sm text-red-600";
        errorElement.hidden = true;
        errorElement.setAttribute("role", "alert");

        const label = feedbackForm.querySelector(`label[for="${field.id}"]`);
        (label || field).insertAdjacentElement("afterend", errorElement);
      }

      const describedBy = new Set(
        (field.getAttribute("aria-describedby") || "")
          .split(/\s+/)
          .filter(Boolean)
      );
      describedBy.add(errorElement.id);
      field.setAttribute("aria-describedby", [...describedBy].join(" "));

      return errorElement;
    }

    function setFieldState(field, isValid, errorMessage = "") {
      const errorElement = getErrorElement(field);

      field.classList.remove("border-red-500", "border-green-500");

      if (isValid) {
        field.classList.add("border-green-500");
        field.removeAttribute("aria-invalid");
        errorElement.textContent = "";
        errorElement.hidden = true;
        return true;
      }

      field.classList.add("border-red-500");
      field.setAttribute("aria-invalid", "true");
      errorElement.textContent = errorMessage;
      errorElement.hidden = false;
      return false;
    }

    function validateUsername() {
      const value = username.value.trim();
      const isValid = value.length >= 2;
      return setFieldState(
        username,
        isValid,
        value.length === 0
          ? "Введіть ім’я."
          : "Ім’я має містити щонайменше 2 символи."
      );
    }

    function validateEmail() {
      const value = email.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailPattern.test(value);
      return setFieldState(
        email,
        isValid,
        value.length === 0
          ? "Введіть адресу електронної пошти."
          : "Перевірте формат адреси електронної пошти."
      );
    }

    function validatePhone() {
      const isValid = phone.value === "" && !phone.required
        ? true
        : phonePattern.test(phone.value);

      return setFieldState(
        phone,
        isValid,
        phone.value === ""
          ? "Введіть номер телефону."
          : "Введіть номер у форматі +380XXXXXXXXX без пробілів і символів."
      );
    }

    function validateMessage() {
      const value = message.value.trim();
      const isValid = value.length >= 10;
      return setFieldState(
        message,
        isValid,
        value.length === 0
          ? "Введіть повідомлення."
          : "Повідомлення має містити щонайменше 10 символів."
      );
    }

    function validateAgreement() {
      return setFieldState(
        agreement,
        agreement.checked,
        "Потрібно погодитися з політикою конфіденційності."
      );
    }

    const validators = new Map([
      [username, validateUsername],
      [email, validateEmail],
      [phone, validatePhone],
      [message, validateMessage],
      [agreement, validateAgreement]
    ]);

    function validateAfterInteraction(field) {
      interactedFields.add(field);
      validators.get(field)();
    }

    function addUkrainePhonePrefix() {
      const value = phone.value;

      if (!value.startsWith("0")) {
        return;
      }

      const selectionStart = phone.selectionStart ?? value.length;
      const selectionEnd = phone.selectionEnd ?? value.length;
      const selectionDirection = phone.selectionDirection ?? "none";

      phone.value = `+38${value}`;

      // Префікс додає 3 символи перед введеним нулем.
      const adjustCursor = (position) => position > 0 ? position + 3 : 0;
      phone.setSelectionRange(
        adjustCursor(selectionStart),
        adjustCursor(selectionEnd),
        selectionDirection
      );
    }

    phone.addEventListener("input", () => {
      addUkrainePhonePrefix();
      if (interactedFields.has(phone) || phone.value !== "") {
        validateAfterInteraction(phone);
      }
    });

    for (const field of [username, email, message]) {
      field.addEventListener("input", () => {
        if (interactedFields.has(field) || field.value !== "") {
          validateAfterInteraction(field);
        }
      });
    }

    for (const field of [username, email, phone, message, agreement]) {
      field.addEventListener("blur", () => validateAfterInteraction(field));
    }

    agreement.addEventListener("change", () => {
      validateAfterInteraction(agreement);
    });

    feedbackForm.addEventListener("submit", (event) => {
      const validations = [...validators.values()].map((validate) => validate());

      if (validations.some((isValid) => !isValid)) {
        event.preventDefault();
        feedbackForm.querySelector('[aria-invalid="true"]')?.focus();
      }
    });
  }
}
