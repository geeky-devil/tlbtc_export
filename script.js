// Variables to store audio data and context
let audioChunks = [];
let mediaRecorder;
let audioBlob;
let audioURL;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let recognizedText = "";
let aiResponse = "";
let ttsState = 'idle';
// Call llm via fetch
async function getResponse(key) {
	var url="https://api.groq.com/openai/v1/chat/completions";
	var txt=recognizedText;
	var model="llama-3.1-8b-instant";
	var api_key=key;
	try {
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${api_key}`,
		},
		body: JSON.stringify({
			model:model,
			messages:[
				{
					role:"system",
					content:"You are a cool and calm guy. You play along with user's imagination. Keep your reponses short."
				},
				{
					role:"user",
					content:txt
				},
			],
			max_tokens:1024,
			stream:false,
		})
	});
		const data = await response.json();
		//console.log('Raw json', data,key);
		if (response.ok){
			aiResponse="";
			//google studio api
			//const generatedText = data.candidates[0].content.parts[0].text; 
			try {

				const generatedText = data.choices[0].message.content;
				console.log("Generated text:", generatedText);
				aiResponse=generatedText;
				window.aiResponse=aiResponse;
				return generatedText;
			} catch (e){
				console.warn("response is stuctured differently");
				return 'CHECK FORMAT';
			}
			
		}
		// // read stream
		// while(true){
		// 	const {done,value} = await reader.read();
		// 	if (done) break;
			
		// // 	// decode the chucks
		// 	const chunk= decoder.decode(value);
		// 	buffer+=chunk;
		// 	console.log('Raw chunk :',chunk);	
			
		// 	const lines = buffer.split('\n');
        
		// 	// Process complete lines
		// 	for (let i = 0; i < lines.length - 1; i++) {
		// 		const line = lines[i];
				
		// 		// Only process lines starting with 'data: '
		// 		if (line.startsWith('data: ')) {
		// 			try {
		// 				const cleanLine = line.replace(/^data: /, '').trim();
						
		// 				// Skip empty lines and '[DONE]'
		// 				if (cleanLine && cleanLine !== '[DONE]') {
		// 					const parsedLine = JSON.parse(cleanLine);
		// 					console.log('Parsed Line', parsedLine);
		// 					console.log("Generated Text",)
		// 					// Process the parsed line as needed
		// 				}
		// 			} catch (error) {
		// 				console.error('Parsing error:', error);
		// 				console.log('Problematic line:', line);
		// 			}
		// 		}
		// 	}
		// 	buffer = lines[lines.length - 1];

		//  	for ( const line of parsedLine){
		//  	 	const {choices}= line;
		//  	 	const {delta} = choices[0];
		//  	 	const {content}=delta;
		// 		if (content){
		// 			console.log(content);
		// 			window.aiResponse+=content;
		// 		}
		//  	}	
		//}
	} catch(error){
		console.error('Stream error',error.message);
	}
}
// Request microphone access and set up the recorder
async function setupMicrophone() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		
		mediaRecorder.ondataavailable = function(event) {
			audioChunks.push(event.data);
		};
		
		mediaRecorder.onstop = function() {
			audioBlob = new Blob(audioChunks, { 'type' : 'audio/wav; codecs=opus' });
			audioURL = URL.createObjectURL(audioBlob);
			audioChunks = [];
		};
		
		console.log("Microphone setup complete.");
	} catch (error) {
		console.error("Error accessing microphone:", error);
	}
}

// Start recording audio
function startRecording() {
	if (mediaRecorder && mediaRecorder.state === "inactive") {
		mediaRecorder.start();
		console.log("Recording started...");
	}
}

// Stop recording audio
function stopRecording() {
	if (mediaRecorder && mediaRecorder.state === "recording") {
		mediaRecorder.stop();
		console.log("Recording stopped...");
	}
}

// Play the recorded audio
function playAudio() {
	if (audioURL) {
		const audio = new Audio(audioURL);
		audio.play();
		console.log("Playing recorded audio...");
	} else {
		console.warn("No audio recorded yet.");
	}
}


// Convert recorded audio to text (STT)

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.continuous = true;
recognition.interimResults = true;
window.isListening=true;

function startListening() {
	recognition.onstart = function() {
		console.log("Speech recognition started");
		window.recognitionState = 'listening';
	};
	
	recognition.onend = function() {
		console.log("Speech recognition ended");
		window.recognitionState = 'idle';
		// If Button is still held down
		if (window.isListening) recognition.start();
	};
	
	recognition.onresult = function(event) {
		//recognizedText = event.results[0][0].transcript;
		//console.log("Recognized Text:", recognizedText);
		recognizedText = "";               // Clear previous results for fresh display
		for (let i = 0; i < event.results.length; i++) {
			recognizedText += event.results[i][0].transcript;
		}
		console.log("Recognized Text (real-time):", recognizedText);
		window.recognizedText = recognizedText;
		
	};
	
	recognition.onerror = function(event) {
		console.error("Speech recognition error:", event.error);
		window.recognitionState = 'error';
	};

	recognition.start();
}

 function stopListening(){
	recognition.stop();
	window.isListening=false;
 }

// Text-to-Speech (TTS) Function
function speak() {
	console.log('tts called');
	const text=aiResponse;
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.voice = speechSynthesis.getVoices().find(voice => voice.name === "Google US English") || speechSynthesis.getVoices()[0];
	utterance.onstart = () => {
		console.log('Started speaking');
		window.ttsState = 'speaking';
	};
	
	utterance.onend = () => {
		console.log('Finished speaking');
		window.ttsState = 'idle';
	};
	
	utterance.onerror = (event) => {
		console.error('TTS Error:', event.error);
		window.ttsState = 'error';
	};
	speechSynthesis.speak(utterance);
}
// Function to stop speaking
function stopSpeaking() {
	const synth = window.speechSynthesis;
	synth.cancel();
	window.ttsState = 'idle';
}

// Function to pause speaking
function pauseSpeaking() {
	const synth = window.speechSynthesis;
	synth.pause();
	window.ttsState = 'paused';
}

// Function to resume speaking
function resumeSpeaking() {
	const synth = window.speechSynthesis;
	synth.resume();
	window.ttsState = 'speaking';
}

window.ttsState = ttsState;
window.setupMicrophone = setupMicrophone;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.playAudio = playAudio;
window.startListening = startListening;
window.stopListening=stopListening;
window.recognizedText = recognizedText;
window.getResponse=getResponse; 
window.aiResponse=aiResponse;
window.speak=speak;