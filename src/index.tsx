import { render } from "preact"
import App from "./app/App"
import "./fonts.css"
import setupPlausible from "./helpers/plausible"
import "./index.css"

setupPlausible()

render(<App />, document.getElementById("app"))
