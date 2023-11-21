const express = require("express");
const bodyParser = require("body-parser");
const {
  generateSwiftClass,
  generateSwiftClassCodable,
} = require("./swiftClassGenerator");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/generate", (req, res) => {
  const className = req.body.className;
  const jsonData = JSON.parse(req.body.jsonData);
  const generationType = req.body.generationType;
  const nullable = req.body.nullable;

  if (generationType == "codable") {
    const swiftClassCode = generateSwiftClassCodable(
      jsonData,
      className,
      nullable
    );
    res.send(swiftClassCode);
  } else {
    const swiftClassCode = generateSwiftClass(jsonData, className, nullable);
    res.send(swiftClassCode);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
