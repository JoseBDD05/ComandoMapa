// Prefijo que se usará como palabra clave para activar comandos
const ordenPrefijo = "MAPA";

// Espera a que el contenido del DOM esté completamente cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {
  // Obtención de referencias a los elementos del DOM
  const startBtn = document.getElementById("startBtn"); // Botón para iniciar el reconocimiento de voz
  const outputText = document.getElementById("outputText"); // Área donde se mostrará el mensaje detectado
  const msgText = document.getElementById("msgText"); // Mensaje de estado del reconocimiento de voz

  // Mensaje inicial que se mostrará en la interfaz
  outputText.innerHTML = `Di ${ordenPrefijo} para empezar a interactuar`;

  let recognition; // Objeto para manejar el reconocimiento de voz
  let stoppedManually = false; // Bandera para determinar si la detención fue manual

  // Verificar si el navegador soporta reconocimiento de voz
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition(); // Inicialización del reconocimiento de voz
    recognition.continuous = true; // Permite que la escucha continúe indefinidamente
    recognition.lang = "es-MX"; // Configuración del idioma a español de México
  } else {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return; // Salir del script si el navegador no es compatible
  }

  // Evento de clic en el botón para iniciar el reconocimiento de voz
  startBtn.addEventListener("click", () => {
    stoppedManually = false; // Restablece la bandera de detención manual
    recognition.start(); // Inicia el reconocimiento de voz
    startBtn.disabled = true; // Deshabilita el botón mientras se está escuchando
    outputText.textContent = `Escuchando... Di ${ordenPrefijo} para interactuar.`;
    msgText.innerHTML = ""; // Limpia mensajes anteriores
  });

  // Evento que maneja los resultados del reconocimiento de voz
  recognition.onresult = (event) => {
    let transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase(); // Obtiene y formatea el texto reconocido
    console.log("Texto reconocido:", transcript);

    // Si el usuario dice "MAPA SALIR", se detiene el reconocimiento
    if (transcript.includes(ordenPrefijo + " SALIR")) {
      stoppedManually = true; // Marca que la detención fue manual
      recognition.stop(); // Detiene el reconocimiento
      startBtn.disabled = false; // Habilita nuevamente el botón de inicio
      outputText.textContent = "Detenido. Presiona el botón para comenzar nuevamente.";
      msgText.innerHTML = ""; // Limpia mensajes anteriores
    } 
    // Si la frase contiene la palabra clave "MAPA", se muestra el mensaje detectado
    else if (transcript.includes(ordenPrefijo)) {
      outputText.innerHTML = `Mensaje detectado: <strong><em>${transcript}</em></strong>`;
      
      // Enviar el mensaje al servidor PHP para obtener la respuesta de la API de OpenAI
      fetch('http://3.221.161.15/api-gpt-php/endpoints/chat.php', {
        method: 'POST', // Método HTTP utilizado para la solicitud
        headers: {
          'Content-Type': 'application/json' // Indica que el cuerpo de la solicitud está en formato JSON
        },
        body: JSON.stringify({ message: transcript }) // Convierte el mensaje en JSON y lo envía al servidor
      })
      .then(response => response.json()) // Convierte la respuesta en un objeto JSON
      .then(data => {
        if (data.status === 200) {
          // Muestra la respuesta como "avanzar", "detente", o "retrocede"
          
          msgText.innerHTML = `<strong style="font-size: 24px;">${data.data.reply}</strong>`;

        } else {
          msgText.innerHTML = `<strong>Error:</strong> ${data.message}`;
        }
      })
      .catch(error => {
        console.error("Error:", error); // Muestra el error en la consola
        outputText.innerHTML += `<br><strong>Error en la comunicación con el servidor.</strong>`;
      });
      msgText.innerHTML = ""; // Limpia mensajes anteriores
    }
  };

  // Evento que maneja errores en el reconocimiento de voz
  recognition.onerror = (event) => {
    console.error("Error en el reconocimiento:", event.error); // Muestra el error en la consola
    
    // Manejo de errores específicos
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("Error: El micrófono no tiene permisos o fue bloqueado.");
    } else if (event.error === "network") {
      alert("Error: Problema de conexión con el servicio de reconocimiento de voz.");
    }
    
    recognition.stop(); // Detiene el reconocimiento en caso de error
    startBtn.disabled = false; // Habilita nuevamente el botón
  };

  // Evento que se activa cuando el reconocimiento de voz finaliza
  recognition.onend = () => {
    if (!stoppedManually) {
      // Mensaje indicando que el reconocimiento se detuvo inesperadamente
      msgText.innerHTML = "El reconocimiento de voz se detuvo inesperadamente<br>Habla nuevamente para continuar...";
      recognition.start(); // Reinicia automáticamente el reconocimiento
    }
  };
});
