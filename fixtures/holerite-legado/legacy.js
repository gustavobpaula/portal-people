const unavailable = document.body.dataset.state === "unavailable";
document.getElementById("payslips").hidden = unavailable;
document.getElementById("unavailable").hidden = !unavailable;
