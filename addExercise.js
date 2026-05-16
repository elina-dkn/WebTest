import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



onAuthStateChanged(auth, async (user) => {
    if (!user) window.location.href = "auth.html";

    const splitsSnap = await getDocs(
        collection(db, "users", user.uid, "splits")
    );

    const splits = splitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const select = document.getElementById("selectSplit");


    splits.forEach((docSnap, i) => {
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = docSnap.name;
        select.appendChild(option);
    });
    

});
