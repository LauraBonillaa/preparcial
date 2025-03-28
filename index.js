const socket = io("http://localhost:5050", { path: "/rea-time" });

document.getElementById("register-btn").addEventListener("click", registerUser);
document.getElementById("scream-btn").addEventListener("click", sendScream);
document.getElementById("get-btn").addEventListener("click", getUsers);

document.getElementById("scream-btn").style.display = "none";



function registerUser() {
    const nameInput = document.querySelector("#name");
    const name = nameInput.value.trim();

    if (!name) {
        alert("Por favor, ingresa un nombre válido.");
        return;
    }

    fetch("http://localhost:5050/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            sessionStorage.setItem("username", name);
            sessionStorage.setItem("role", data.role);
            alert(data.message);
            nameInput.value = "";

            document.getElementById("nickname").textContent = name;
            document.getElementById("personaje").textContent = data.role;

            document.getElementById("register-section").style.display = "none";
            document.getElementById("game-section").style.display = "block";
            
            if (data.role === "Marco") {
                const marcoDiv = document.createElement("div");
                marcoDiv.id = "gritos-marco";
                document.body.appendChild(marcoDiv);
            } else {
                const PolosDiv = document.createElement("div");
                PolosDiv.id = "gritos-polos";
                document.body.appendChild(PolosDiv);
            }
        
            socket.emit("registrar-socket", name);
        } else {
            alert(data.message);
        }
    })
    .catch((error) => console.error("Error:", error));
}

document.addEventListener("DOMContentLoaded", () => {
    const storedName = sessionStorage.getItem("username");
    const storedRole = sessionStorage.getItem("role");

    if (storedName && storedRole) {
        document.getElementById("nickname").textContent = storedName;
        document.getElementById("personaje").textContent = storedRole;

        document.getElementById("register-section").style.display = "none";
        document.getElementById("game-section").style.display = "block";

        socket.emit("registrar-socket", storedName);
    } else {
        document.getElementById("register-section").style.display = "block";
        document.getElementById("game-section").style.display = "none";
    }
});

function getUsers() {
    fetch("http://localhost:5050/users")
        .then((response) => response.json())
        .then((data) => console.log("Usuarios registrados:", data))
        .catch((error) => console.error("Error:", error));
}

function sendScream() {
    const name = sessionStorage.getItem("username");
    const role = sessionStorage.getItem("role");

    if (role) {
        fetch("http://localhost:5050/gritar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                alert(data.message);
            }
        })
        .catch((error) => console.error("Error:", error));
    } else {
        alert("No se pudo gritar");
    }
}


socket.on("coordenadas", (data) => {
    const gritosDiv = document.getElementById("gritos-polos");
    
    if (gritosDiv) {
        const nuevoGrito = document.createElement("p");
        nuevoGrito.textContent = data.message;
        gritosDiv.appendChild(nuevoGrito);
    }
});

socket.on("gritos-polos-actualizados", (gritos) => {
    const gritosMarcoDiv = document.getElementById("gritos-marco");

    if (gritosMarcoDiv) {
        gritosMarcoDiv.innerHTML = ""; 

        gritos.forEach((grito, index) => {
            const nuevoGrito = document.createElement("button");
            nuevoGrito.textContent = `${grito.message}`;
            nuevoGrito.id = `grito-${grito.role}-${grito.id}`; 
        
           
            nuevoGrito.setAttribute("data-role", grito.role);
            nuevoGrito.setAttribute("data-id", grito.id);
        
            nuevoGrito.addEventListener("click", () => {
        
                const resultado = (grito.role === "Polo Especial") 
                    ? { message: "🎉 ¡Ganó Marco! 🎉", color: "green" }
                    : { message: "😢 Perdió Marco 😢", color: "red" };
            

                socket.emit("resultado-juego", resultado);
            });
            
            
        console.log(grito.rol)
            gritosMarcoDiv.appendChild(nuevoGrito);
        });
        
    }
});

socket.on("mostrar-resultado", (resultado) => {
    const ganador = document.getElementById("ganador");
    if (ganador) {
        ganador.innerHTML = `<p style="color: ${resultado.color};">${resultado.message}</p>`;
    }
});


socket.on("ocultar-grito", () => {
    console.log("Tu grito no se mostrará.");
});

socket.on("usuarios-actualizados", (numUsuarios) => {
    const usuariosConectados = numUsuarios + 1; 

    console.log(`Usuarios conectados: ${usuariosConectados}`);

    const screamBtn = document.getElementById("scream-btn");

    if (usuariosConectados >= 3) {
        screamBtn.style.display = "block";
    } else {
        screamBtn.style.display = "none";
    }
});
