import { app } from "./app.js";

const port = Number(process.env.PORT || process.env.API_PORT || 4000);
app.listen(port);
