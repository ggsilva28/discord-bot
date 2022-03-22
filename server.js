const express = require("express");
const routes = require("./routes");

const app = express();
const port = process.env.PORT || "1337";
app.set("port", port);

app.use('/', routes);

app.listen(port, () => console.log(`Server running on localhost:${port}`));