import { json } from "stream/consumers";
import { request } from "../../lib/api";
import { UserProfile } from "./types";
import { promises } from "dns";

export const sessionService = {
    async login(credentials: {email:string; pass:string}){
        return request<{user: {firstName: string; email:string}}>("auth/login",{
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },
    async getUser(): Promise<UserProfile>{
        return request<UserProfile>("users/me");
    },
    async logout(){
        return request("auth/logout", { method: "POST" });
    }
}