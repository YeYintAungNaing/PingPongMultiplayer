import express from "express"
import cors from "cors"

const app = express()
app.use(express.json());

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Authorization", "Content-Type"],
}))


app.listen(7000, () => {
    console.log("Listening on port 7000")
})

