// routes/system.js

const express = require("express");
const os = require("os");
const { sseHandler } = require("../services/sseService");

const router = express.Router();

// Route to get the server's local Wi-Fi IP address
router.get("/get-ip", (req, res) => {
    const networkInterfaces = os.networkInterfaces();
    const wifiInterfaceNames = ["en0", "wlan0", "Wi-Fi", "Wireless Network Connection"];
    let wifiIp = null;

    for (const name of wifiInterfaceNames) {
        const iface = networkInterfaces[name];
        if (iface) {
            const ipv4Info = iface.find(info => !info.internal && info.family === "IPv4");
            if (ipv4Info) {
                wifiIp = ipv4Info.address;
                break;
            }
        }
    }

    if (wifiIp) {
        res.json({ ip: wifiIp });
    } else {
        res.status(404).json({ error: "Wi-Fi IP not found" });
    }
});

// Route for Server-Sent Events
router.get("/events", sseHandler);


module.exports = router;