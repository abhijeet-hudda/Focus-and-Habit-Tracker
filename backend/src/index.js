import {app} from "./app.js"
import connectDB from "./db/db_connect.js"


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port :${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("mongoDB connection failed", error);
})