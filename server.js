const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  console.log(`DR.AYAZHAN API is running on http://localhost:${env.port}`);
});
