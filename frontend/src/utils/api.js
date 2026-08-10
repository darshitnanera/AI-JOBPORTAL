import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
})

//attach token automatically
API.interceptors.request.use((req)=>{
    const user = JSON.parse(localStorage.getItem("jobportal_user"));
    if(user?.token){
        req.headers.Authorization = `Bearer ${user.token}`;
    }
    return req;
});

export default API;