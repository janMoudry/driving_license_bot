const puppeteer = require("puppeteer");
const fs = require("fs");
const { parse } = require("path");

const url = "https://etesty2.mdcr.cz/Test/TestPractise/15";

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function run() {
  console.log("\n\n\n\n\n\n\n\n\n\n");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(process.argv[2]);
  console.log("page loaded");

  try {
    const data = [];

    console.log("starting agree cookies");
    await page.keyboard.press("Enter");
    console.log("cookies accept");

    await page.waitForSelector("h3#questionNumberID");
    let numberOfQuestions = await page.$("span#questionCounterID");
    let numberOfQuestionsValue = await page.evaluate(
      (el) => el.textContent,
      numberOfQuestions,
    );

    const numberOfQuestionsFinal = numberOfQuestionsValue.slice(
      -3,
      numberOfQuestions.toString().length,
    );

    console.log(process.argv);

    for (let i = 0; i <= 1; i++) {
      await page.waitForSelector("h3#questionNumberID");
      let questionNumber = await page.$("h3#questionNumberID");
      let questionNumberValue = await page.evaluate(
        (el) => el.innerHTML,
        questionNumber,
      );

      console.log("\n", questionNumberValue, "\n");

      await page.waitForSelector("p.question-text");
      let questionText = await page.$("p.question-text");
      let questionTextValue = await page.evaluate(
        (el) => (el ? el.innerHTML : ""),
        questionText,
      );
      let questionImage = await page.$("div.image-frame > img");
      let questionImageValue = await page.evaluate(
        (el) => (el ? el.getAttribute("src") : ""),
        questionImage,
      );

      let questionVideo = await page.$("div.image-frame > video > source");
      let questionVideoValue = await page.evaluate(
        (el) => (el ? el.getAttribute("src") : ""),
        questionVideo,
      );

      const answer = await page.$("div.answer");
      answer.click();
      const next = await page.$("input#nextButtonID");
      next.click();

      let answersToSave = [];
      let answers = await page.$$("div.answer > p");
      let answerContainer = await page.$$("div.answer");
      answers.map(async (item, index) => {
        let answer = await item.evaluate((el) => el.innerHTML, item);
        let itemContainer = await answerContainer[index].evaluate(
          (el) => el.getAttribute("class"),
          answerContainer[index],
        );

        answersToSave.push({
          answer: answer,
          correct: itemContainer === "answer correct",
        });
      });

      data.push({
        id: i,
        questionNumber: questionNumberValue,
        questionText: questionTextValue,
        answers: answersToSave,
        videoLink: questionVideoValue
          ? `https://etesty2.mdcr.cz${questionVideoValue}`
          : null,
        Image: questionImageValue
          ? `https://etesty2.mdcr.cz${questionImageValue}`
          : null,
      });
      await next.click();
    }

    await page.waitForSelector("h2#practiseTitleID");
    let title = await page.$("h2#practiseTitleID");
    let titleValue = await page.evaluate(
      (el) => (el ? el.innerHTML : ""),
      title,
    );

    fs.writeFileSync(
      `Questions/${process.argv[3]}.json`,
      JSON.stringify({ title: titleValue, data: data }),
    );

    console.log("end");
    console.log("\n\n\n\n\n\n\n\n\n\n");
    browser.close();
  } catch (err) {
    browser.close();
  }
}
run();
