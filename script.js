const wrapper = document.querySelector(".wrapper"),
qrInput = wrapper.querySelector(".form input"),
genrateBtn = wrapper.querySelector(".form button"),
qrImg = wrapper.querySelector(".qr-code img");

genrateBtn.addEventListener("click", () => {
    let qrValue = qrInput.value;
    if(!qrValue) return; //if the input is empty then return from here
    genrateBtn.innerText = "Generating Qr Code...";
    // api and passing the api returned img src to qr img
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${qrValue}`;
    qrImg.addEventListener("load", () => {
       wrapper.classList.add("active"); 
       genrateBtn.innerText = "Generate QR Code";
    });
});

qrInput.addEventListener("keyup", () => {
    if(!qrInput.value) {
        wrapper.classList.add("active"); 
    }
});
