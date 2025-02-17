import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';

const collect = Router();

collect.post('/get-route', verifyToken, async (req, res) => {
    res.status(200).json({ message: "WORK IN PROGRESS" });
});

collect.post('/start-route', verifyToken, async (req, res) => {
    res.status(200).json({ message: "WORK IN PROGRESS" });
});

collect.post('/save-route', verifyToken, async (req, res) => {
    res.status(200).json({ message: "WORK IN PROGRESS" });
});

collect.post('/get-settlement-details', verifyToken, async (req, res) => {
    res.status(200).json({ message: "WORK IN PROGRESS" });
});

collect.post('/get-client-details', verifyToken, async (req, res) => {
    res.status(200).json({ message: "WORK IN PROGRESS" });
});

collect.post('/get-collect-details', verifyToken, async (req, res) => {
    res.status(200).json({ message: "WORK IN PROGRESS" });
});

collect.post('/get-collect-list', verifyToken, async (req, res) => {
    res.status(200).json({ message: "WORK IN PROGRESS" });
});

export default home;