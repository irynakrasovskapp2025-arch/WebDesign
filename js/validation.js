const feedbackForm = document.getElementById("feedbackForm");

if (!feedbackForm) {
  console.error('Форму з id="feedbackForm" не знайдено.');
} else {
  const username = feedbackForm.querySelector("#username");
  const email = feedbackForm.querySelector("#email");
  const phone = feedbackForm.querySelector("#phone");
  const message = feedbackForm.querySelector("#message");
  const agreement = feedbackForm.querySelector("#agreement");
  const successDialog = document.getElementById("feedback-success-dialog");
  const closeSuccessDialogButton = successDialog?.querySelector("[data-dialog-close]");

  const fields = { username, email, phone, message, agreement };
  const missingFields = Object.entries(fields)
    .filter(([, field]) => !field)
    .map(([name]) => name);
  if (!successDialog) missingFields.push("feedback-success-dialog");
  if (!closeSuccessDialogButton) {
    missingFields.push("feedback-success-dialog [data-dialog-close]");
  }

  if (missingFields.length > 0) {
    console.error(`У формі не знайдено поля: ${missingFields.join(", ")}.`);
  } else {
    const phonePattern = /^\+380\d{9}$/;
    let interactedFields = new WeakSet();
    let returnFocusTarget = null;
    let previousPhoneValue = phone.value;
    let wholePhoneValueSelected = false;

    closeSuccessDialogButton.addEventListener("click", () => {
      successDialog.close();
    });

    successDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      successDialog.close();
    });

    successDialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        successDialog.close();
      }
    });

    successDialog.addEventListener("close", () => {
      feedbackForm.reset();
      interactedFields = new WeakSet();
      previousPhoneValue = phone.value;
      wholePhoneValueSelected = false;

      for (const field of Object.values(fields)) {
        field.classList.remove("border-red-500", "border-green-500");
        field.removeAttribute("aria-invalid");

        const errorElement = feedbackForm.querySelector(`#${field.id}-error`);
        if (errorElement) {
          errorElement.textContent = "";
          errorElement.hidden = true;
        }
      }

      if (returnFocusTarget?.isConnected) {
        returnFocusTarget.focus();
      }
      returnFocusTarget = null;
    });

    function showSuccessDialog(submitter) {
      returnFocusTarget = submitter || document.activeElement;
      successDialog.showModal();
      closeSuccessDialogButton.focus();
    }

    // Вимикаємо нативні підказки, щоб показувати власні повідомлення для всіх полів.
    feedbackForm.noValidate = true;

    function getErrorElement(field) {
      let errorElement = feedbackForm.querySelector(`#${field.id}-error`);

      if (!errorElement) {
        errorElement = document.createElement("p");
        errorElement.id = `${field.id}-error`;
        errorElement.className = "mt-1 text-sm text-red-600";
        errorElement.hidden = true;
        errorElement.setAttribute("role", "status");
        errorElement.setAttribute("aria-live", "polite");
        errorElement.setAttribute("aria-atomic", "true");

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
      const value = phone.value;

      if (value === "" && !phone.required) {
        phone.classList.remove("border-red-500", "border-green-500");
        phone.removeAttribute("aria-invalid");

        const errorElement = getErrorElement(phone);
        errorElement.textContent = "";
        errorElement.hidden = true;
        return true;
      }

      if (phonePattern.test(value)) {
        return setFieldState(phone, true);
      }

      let errorMessage;

      if (value === "") {
        errorMessage = "Введіть номер телефону.";
      } else if (/\s|[()-]/.test(value)) {
        errorMessage = "Приберіть пробіли, дужки й дефіси з номера.";
      } else if (/[a-z]/i.test(value)) {
        errorMessage = "Номер може містити лише цифри та префікс +380.";
      } else if (/^\+380\d*$/.test(value)) {
        const digitCount = value.length - 4;
        errorMessage = digitCount > 9
          ? "Після +380 має бути рівно 9 цифр. Видаліть зайві цифри."
          : "Додайте 9 цифр після префікса +380.";
      } else {
        errorMessage = "Введіть номер у форматі +380XXXXXXXXX.";
      }

      return setFieldState(phone, false, errorMessage);
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

    function addUkrainePhonePrefix(event) {
      const value = phone.value;
      const isInsertion = event.inputType?.startsWith("insert");
      const isStartingNumber = previousPhoneValue === ""
        || previousPhoneValue === "0"
        || wholePhoneValueSelected;

      if (!isInsertion || !isStartingNumber || !value.startsWith("0")) {
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

    phone.addEventListener("beforeinput", () => {
      wholePhoneValueSelected = phone.selectionStart === 0
        && phone.selectionEnd === phone.value.length;
    });

    phone.addEventListener("input", (event) => {
      addUkrainePhonePrefix(event);
      wholePhoneValueSelected = false;
      previousPhoneValue = phone.value;

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
        return;
      }

      event.preventDefault();
      showSuccessDialog(event.submitter);
    });
  }
}
