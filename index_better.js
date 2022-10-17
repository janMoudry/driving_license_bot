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
  const array = [];
  console.log("page loaded");

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

  try {
    for (let i = 0; i <= numberOfQuestionsFinal - 1; i++) {
      const next = await page.$("input#nextButtonID");
      await next.click();
      await page.screenshot({ path: "idk.png" });
      // await delay(1000);
      let questionNumber = await page.$("#questionNumberID");
      let questionNumberValue = await page.evaluate(
        (el) => el.innerHTML,
        questionNumber,
      );
      console.log(questionNumberValue);

      await page.waitForSelector(".question-text");
      let questionText = await page.$(".question-text");
      let questionTextValue = await page.evaluate(
        (el) => (el.textContent.length > 4 ? el.textContent : null),
        questionText,
      );
      console.log(questionTextValue);

      let questionTextInFrame = await page.$(".image-frame > .question-text");
      let questionTextInFrameValue = await page.evaluate(
        (el) => (el ? el.textContent : null),
        questionTextInFrame,
      );
      console.log(questionTextInFrameValue);

      let questionImage = await page.$(".image-frame > img");
      let questionImageValue = await page.evaluate(
        (el) => (el ? el.getAttribute("src") : null),
        questionImage,
      );
      console.log(questionImageValue);

      let questionImageArrayToSave = [];
      let questionImageArray = await page.$$(".image-frame > div > img");

      await questionImageArray.map(async (image) => {
        let imageValue = await page.evaluate(
          (el) => (el ? el.getAttribute("src") : null),
          image,
        );
        questionImageArrayToSave.push(`https://etesty2.mdcr.cz${imageValue}`);
      });

      let questionVideo = await page.$(".image-frame > video > source");
      let questionVideoValue = await page.evaluate(
        (el) => (el ? el.getAttribute("src") : null),
        questionVideo,
      );
      console.log(questionVideoValue);

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
          answer: answer ? answer : null,
          correct: itemContainer === "answer correct",
          id: index,
        });
      });

      // if (answersToSave[0].answer.length < 2) {
      //   let imageAnswers = await page.$$("div.answer > img");
      // }

      console.log(answersToSave);

      const data = {
        id: i,
        questionNumber: questionNumberValue,
        question: questionTextValue
          ? questionTextValue
          : questionTextInFrameValue,
        image: questionImageValue
          ? `https://etesty2.mdcr.cz${questionImageValue}`
          : questionImageArrayToSave,
        video: questionVideoValue
          ? `https://etesty2.mdcr.cz${questionVideoValue}`
          : null,
        asnwers: answersToSave,
      };

      array.push(data);
      await next.click();
      // await delay(200);
      console.log(data);
    }
    await page.waitForSelector("h2#practiseTitleID");
    let title = await page.$("h2#practiseTitleID");
    let titleValue = await page.evaluate(
      (el) => (el ? el.innerHTML : ""),
      title,
    );

    fs.writeFileSync(
      `../driving-license/questions/${process.argv[3]}.json`,
      JSON.stringify({
        title: titleValue,
        numberOfQuestions: numberOfQuestionsFinal,
        data: array,
      }),
    );
    console.log("end");
    console.log("\n\n\n\n\n\n\n\n\n\n");
    browser.close();
  } catch (err) {
    browser.close();
  }
}
run();
