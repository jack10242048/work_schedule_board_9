// firebase 設定 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, where, setDoc,orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAnVC2AYzFl3rCBp0f-i4GBuOHtsvYeFCw",
    authDomain: "schedule-test3.firebaseapp.com",
    projectId: "schedule-test3",
    storageBucket: "schedule-test3.firebasestorage.app",
    messagingSenderId: "740461497434",
    appId: "1:740461497434:web:7f88351f0cce722f4a9c63"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 當前時間
function updateTime(){

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth()+1).padStart(2,"0");
    const day = String(now.getDate()).padStart(2,"0");

    const hours = String(now.getHours()).padStart(2,"0");
    const minutes = String(now.getMinutes()).padStart(2,"0");
    const seconds = String(now.getSeconds()).padStart(2,"0");

    const text = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    document.getElementById("timeDisplay").textContent = text;

}

setInterval(updateTime,1000);
updateTime();

// 截圖功能
window.capture = function () { 

    html2canvas(document.querySelector(".picture_area")).then(canvas => {

        const img = canvas.toDataURL("image/png");

        // 取得現在日期與時間
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        // 檔名：日期 + 時間
        const filename = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}.png`;

        const link = document.createElement("a");
        link.href = img;
        link.download = filename;
        link.click();

    });

}

// 匯出成 CSV
async function exportToCSV() {
    const querySnapshot = await getDocs(collection(db, "events"));
    //let csvContent = "startDate,endDate,content,createdAt\n"; // CSV 標題列
    let csvContent = "startDate,endDate,content\n"; // CSV 標題列

    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        // 加上逗號分隔
        //csvContent += `${data.startDate},${data.endDate},"${data.content.replace(/"/g,'""')}",${data.createdAt}\n`;
        csvContent += `${data.startDate},${data.endDate},"${data.content.replace(/"/g,'""')}"\n`;
    });

    // 取得現在日期與時間
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    // 檔名：日期 + 時間
    const filename = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}.csv`;

    // 下載 CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
}

document.getElementById("exportCSVBtn").addEventListener("click", exportToCSV);


// 日曆
/*
document.addEventListener("DOMContentLoaded", function() {
const calendarEl = document.getElementById("calendar")
const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
        //left: "prev,next today",
        left: "prev,next",
        center: "title",
        //right: "dayGridMonth,timeGridWeek,timeGridDay",
        //right: "dayGridMonth",
        right: "today"
    },
    buttonText: {
    today: "Today",
        //month: "Month",
        //week: "Week",
        //day: "Day",
        },
    })
    calendar.render()
})
*/

let calendar;

document.addEventListener("DOMContentLoaded", function () {

    const calendarEl = document.getElementById("calendar");

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        headerToolbar: {
            left: "prev,next",
            center: "title",
            right: "today"
        }
    });

    calendar.render();
});

// ======================
// Loading 控制
// ======================
let isLoading = false;

function showLoading(){
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading(){
    document.getElementById("loadingOverlay").style.display = "none";
}

async function runWithLoading(task){

    if(isLoading) return;

    try{

        isLoading = true;
        showLoading();

        return await task();

    }finally{

        hideLoading();
        isLoading = false;

    }

}


// ======================
// 新增事件
// ======================
const addEventBtn = document.getElementById("addEventBtn"); // 新增事件按鈕
const modal = document.getElementById("eventModal"); // 彈出視窗
const closeModal = document.getElementById("closeModal"); // 關閉視窗按鈕

// 顯示 modal
addEventBtn.onclick = () => {
    modal.style.display = "flex";
};

// 隱藏 modal
closeModal.onclick = () => {
    modal.style.display = "none";
};

const saveEvent = document.getElementById("saveEvent"); // 儲存按鈕

saveEvent.addEventListener("click", async () => {

    //const name = document.getElementById("eventName").value;
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const content = document.getElementById("eventContent").value;

    if(start === "" || end === "" || content === ""){
        alert("請輸入完整資料");
        return;
    }

    if(start > end){
        alert("結束日期必須晚於開始日期");
        return;
    }

    await runWithLoading(async ()=>{

        // (資料庫位置，內容)
        await addDoc(collection(db,"events"),{
            startDate: start,
            endDate: end,
            content: content,
            createdAt: Date.now()
        });

    });

    //location.reload(); // 重新讀取
    await loadEvents(); // 重新載入事件列表

    // 關閉視窗
    modal.style.display = "none";

    //清空輸入欄位
    //document.getElementById("eventName").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("eventContent").value = "";
});

// 因為日曆不包含最後一天 所以要加一天
function addOneDay(dateStr){
    const d = new Date(dateStr);
    d.setDate(d.getDate()+1);
    return d.toISOString().split("T")[0];
}


// ======================
// 讀取事件
// ======================
async function loadEvents(){

    const container = document.querySelector(".schedule_container");

    // 清空舊資料
    container.querySelectorAll(".schedule_item:not(:first-child)").forEach(el => el.remove());

    // 清空日曆
    if(calendar){
        calendar.removeAllEvents();
    }

    const querySnapshot = await runWithLoading(async ()=>{

        /*
        const q = query(
            collection(db, "events"),
            orderBy("createdAt")
        );
        */
        const q = query(
            collection(db, "events"),
            orderBy("startDate")
        );

        return await getDocs(q);

    });

    querySnapshot.forEach((docSnap) => {

        const data = docSnap.data();

        const item = document.createElement("div");
        item.classList.add("schedule_item");
        item.dataset.id = docSnap.id;

        const startDiv = document.createElement("div");
        startDiv.classList.add("schedule_item_startData");
        startDiv.textContent = data.startDate;

        const endDiv = document.createElement("div");
        endDiv.classList.add("schedule_item_endData");
        endDiv.textContent = data.endDate;

        const eventDiv = document.createElement("div");
        eventDiv.classList.add("schedule_item_event");
        eventDiv.textContent = data.content;

        // 修改按鈕
        const completeDiv = document.createElement("div");
        completeDiv.classList.add("schedule_item_complete_button");
        completeDiv.textContent = "◯";
        item.appendChild(completeDiv);

        // 修改按鈕
        const modifyDiv = document.createElement("div");
        modifyDiv.classList.add("schedule_item_modify_button");
        modifyDiv.textContent = "✎";
        item.appendChild(modifyDiv);

        // 刪除按鈕
        const deleteDiv = document.createElement("div");
        deleteDiv.classList.add("schedule_item_delete_button");
        deleteDiv.textContent = "✕";



        // 放入日曆
        if(calendar){
            calendar.addEvent({
                title: data.content,
                start: data.startDate,
                end: addOneDay(data.endDate)
            });
        }



        // ======================
        // 事件刪除
        // ======================
        deleteDiv.addEventListener("click", async (e) => {
            e.stopPropagation();
            if(!confirm("確定刪除此工作？")) return;

            await runWithLoading(async () => {
                await deleteDoc(doc(db,"events",item.dataset.id));
            });

            //item.remove();
            await loadEvents();
        });


        // 事件修改
        modifyDiv.addEventListener("click", () => {
            const editModal = document.getElementById("editModal");
            editModal.style.display = "flex";

            document.getElementById("editStartDate").value = data.startDate;
            document.getElementById("editEndDate").value = data.endDate;
            document.getElementById("editEventContent").value = data.content;

            // 記住是哪一個事件
            editModal.dataset.id = item.dataset.id;
        });

        // 事件完成
        completeDiv.addEventListener("click", async (e) => {

        e.stopPropagation();

        if(!confirm("確定完成此工作？")) return;

        await runWithLoading(async () => {

            const data = docSnap.data();

            // 1️⃣ 存到 completedEvents
            await addDoc(collection(db,"completedEvents"),{
                startDate: data.startDate,
                endDate: data.endDate,
                content: data.content,
                completedAt: Date.now()
            });

            // 2️⃣ 刪除原本事件
            await deleteDoc(doc(db,"events",item.dataset.id));

        });

        // 3️⃣ 重新載入畫面
        await loadEvents();

    });

        


        item.appendChild(startDiv);
        item.appendChild(endDiv);
        item.appendChild(eventDiv);
        item.appendChild(completeDiv);
        item.appendChild(modifyDiv);
        item.appendChild(deleteDiv);
        


        container.appendChild(item);

    });

}

// 修改時
const saveEditBtn = document.getElementById("saveEditEvent");
const closeEditModal = document.getElementById("closeEditModal");

// 僅綁定一次
saveEditBtn.addEventListener("click", async () => {
    const id = document.getElementById("editModal").dataset.id;


    const start = document.getElementById("editStartDate").value;
    const end = document.getElementById("editEndDate").value;
    const content = document.getElementById("editEventContent").value;

    if(start === "" || end === ""|| content === "" ){
        alert("請輸入完整資料");
        return;
    }
    if(start > end){
        alert("結束日期必須晚於開始日期");
        return;
    }

    await runWithLoading(async () => {
    await updateDoc(doc(db, "events", id), {
            startDate: start,
            endDate: end,
            content: content
        });
    });

    // 關閉 Modal
    document.getElementById("editModal").style.display = "none";

    // 重新載入事件列表
    await loadEvents();
});

closeEditModal.addEventListener("click", () => {
    document.getElementById("editModal").style.display = "none";
});





// ======================
// 初始化
// ======================

async function init(){
    await loadEvents();
}

init();