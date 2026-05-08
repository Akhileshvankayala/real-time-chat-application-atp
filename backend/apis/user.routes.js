import express from "express"
import { userModel } from "../models/userModel.js"

const router = express.Router()

// 🔥 SEARCH USERS
router.get("/", async (req, res, next) => {
    try {
        const { search } = req.query

        const users = await userModel.find({
            name: { $regex: search || "", $options: "i" }
        }).select("-password")

        res.json({ users })

    } catch (err) {
        next(err)
    }
})

// 🔥 BLOCK USER
router.post("/block", async (req, res, next) => {
    try {
        const userId = req.user.id
        const { blockUserId } = req.body

        const user = await userModel.findById(userId)
        if (!user.blockedUsers.includes(blockUserId)) {
            user.blockedUsers.push(blockUserId)
            await user.save()
        }

        res.json({ message: "User blocked successfully", blockedUsers: user.blockedUsers })

    } catch (err) {
        next(err)
    }
})

export default router