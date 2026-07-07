// firebase.js - Firebase Initialization & Core Operations
const firebaseConfig = {
    databaseURL: "https://smart-farm-platfor-default-rtdb.asia-southeast1.firebasedatabase.app"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

export const financeRef = db.ref("finance");

export const saveTransaction = async (data) => {
    const id = data.id || Date.now();
    const timestamp = Date.now();
    const record = {
        ...data,
        id,
        createdAt: data.createdAt || timestamp,
        updatedAt: timestamp
    };
    await financeRef.child(id).set(record);
    return id;
};

export const deleteTransaction = async (id) => {
    await financeRef.child(id).remove();
};

export const updateTransactionStatus = async (id, status) => {
    await financeRef.child(id).update({
        status,
        updatedAt: Date.now()
    });
};

export const onFinanceUpdate = (callback) => {
    financeRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        callback(Object.values(data));
    });
};
