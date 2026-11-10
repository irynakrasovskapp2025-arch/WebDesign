const quiz = document.querySelector("#candle-quiz");
const quizSteps = [...quiz.querySelectorAll(".quiz-step")];
const quizProgress = document.querySelector("#quiz-progress");
const quizNext = quiz.querySelector(".quiz-next");
const quizBack = quiz.querySelector(".quiz-back");
const quizResult = document.querySelector("#quiz-result");
const quizResultTitle = quiz.querySelector(".quiz-result-title");
const quizResultDescription = quiz.querySelector(".quiz-result-description");
const quizResultPrice = quiz.querySelector(".quiz-result-price");
const quizAddToCart = quiz.querySelector(".quiz-add-to-cart");
const quizRestart = quiz.querySelector(".quiz-restart");
let currentStep = 1;
let recommendedProductId = null;

const recommendations = {
  gift: "4",
  relax: "0",
  energy: "1",
  nature: "5",
  spice: "2",
  caramel: "3"
};

function selectedValue(step) {
  return quiz.querySelector(`input[name="${step}"]:checked`)?.value;
}

function updateStep() {
  quizSteps.forEach((step) => {
    step.hidden = Number(step.dataset.step) !== currentStep;
  });
  quizProgress.textContent = `Крок ${currentStep} із 3`;
  quizBack.hidden = currentStep === 1;
  quizNext.textContent = currentStep === 3 ? "Показати результат" : "Далі";
  quizNext.disabled = !selectedValue(["recipient", "atmosphere", "scent"][currentStep - 1]);
}

function showRecommendation(productId) {
  const card = document.querySelectorAll(".product-card")[Number(productId)];
  recommendedProductId = productId;
  quizSteps.forEach((step) => {
    step.hidden = true;
  });
  quiz.querySelector(".quiz-controls").hidden = true;
  quizProgress.textContent = "Ваш результат";
  quizResultTitle.textContent = card.querySelector(".product-name").textContent.trim();
  quizResultDescription.textContent = card.querySelector(".product-desc").textContent.trim();
  quizResultPrice.textContent = card.querySelector(".product-price").textContent.trim();
  quizResult.hidden = false;
  quizResultTitle.focus();
}

quiz.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  quizNext.disabled = false;

  if (currentStep === 1 && event.target.value === "gift") {
    showRecommendation(recommendations.gift);
  } else if (currentStep === 2 && event.target.value !== "cozy") {
    showRecommendation(recommendations[event.target.value]);
  }
});

quiz.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedValue(["recipient", "atmosphere", "scent"][currentStep - 1])) return;

  if (currentStep === 1) {
    currentStep = 2;
    updateStep();
    quizSteps[1].querySelector("input").focus();
  } else if (currentStep === 2) {
    const atmosphere = selectedValue("atmosphere");
    if (atmosphere === "cozy") {
      currentStep = 3;
      updateStep();
      quizSteps[2].querySelector("input").focus();
    } else {
      showRecommendation(recommendations[atmosphere]);
    }
  } else {
    const scent = selectedValue("scent");
    showRecommendation(recommendations[scent]);
  }
});

quizBack.addEventListener("click", () => {
  if (currentStep <= 1) return;
  currentStep -= 1;
  updateStep();
  quizSteps[currentStep - 1].querySelector("input:checked")?.focus();
});

quizAddToCart.addEventListener("click", () => {
  if (recommendedProductId === null) return;
  document.dispatchEvent(new CustomEvent("candle:add-to-cart", {
    detail: { productId: recommendedProductId }
  }));
  quizAddToCart.textContent = "Додано до кошика";
  quizAddToCart.disabled = true;
});

quizRestart.addEventListener("click", () => {
  quiz.reset();
  quizResult.hidden = true;
  quiz.querySelector(".quiz-controls").hidden = false;
  quizAddToCart.textContent = "В кошик";
  quizAddToCart.disabled = false;
  recommendedProductId = null;
  currentStep = 1;
  updateStep();
  quizSteps[0].querySelector("input").focus();
});

updateStep();
