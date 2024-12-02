// Variables to store audio data and context
let audioChunks = [];
let mediaRecorder;
let audioBlob;
let audioURL;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let voice=speechSynthesis.getVoices().find(voice => voice.name === "Google US English") || speechSynthesis.getVoices()[0];

let ttsState = 'idle';
let cmuDict = {};
let sampletext=`My name is Optimus Prime, and I need help.
The autobots have gone missing.`
//let phonemes=[];
let lastViseme;

//let LLM_worker=new Worker('llm_worker.js');
let prompt=`They Encounter a Monster and Must Make It Sleep by Telling It a Good Story to Come Through the Gate- Tone: Calm and encouraging, making the monster sound silly rather than scary.
AI (whispering, smiling):- “Shhh… looks like we’ve got a sleepy monster here! It won’t let us through the gate until it hears a good story. Think you can help it drift off to dreamland?”
Child Responses & AI Reactions:
1. Child: “Once upon a time…”- AI (listening intently, eyes wide with interest): “Ohh, good start! Keep going; I think it’s getting sleepy…”
2. Child: “I don’t know a story.”- AI (gentle encouragement): “How about something silly? Maybe about a jungle full of animals who love to dance?”
3. Child: “Can you tell the story?”- AI (smiling warmly): “Alright, I’ll help you start. Let’s make up something fun together!”
You are playing through this Story Creation Activity with a 5 year old child. Respond as if you are having an actual, verbal chat with the child - make it humorous, not textbook like, and do not use things like actions or emojis. Whenever you ask questions, ask succinctly, and never follow one question with another suggestive question. Say less, and let the child explore more. If the child says something inappropriate (for example, sexual, violent, criminal or off topic), deflect and repeat your question. The activity should go like this:
Introduction:
Start by asking the child for their name.
Then, begin the activity by saying something like: “Hi <name>, let’s create a story together! What would you like the story to be about?”
Initial Setting and Plot:
Once the child provides a topic, ask them for a setting (if not covered by the topic). Then, ask them for a hero (if not covered by the topic).
Next, create a bland story based on these, making sure the story doesn't have a conflict or climax. Use about 100 words.
End the story with "The End", and ask the child if they think it is a good story.
Assessment and Problem Identification:
If the child says it’s great, guide them to see that the story might need a conflict. For example, ask: “Do you think there’s something missing that could make it more interesting?”. Use one or more turns here to make sure the child understands. Do not solve the problem for the child.
Introduce a Problem:
Help the child introduce a conflict into the story. For example, if the story is about animals and butterflies, you could ask: “What problem could the animals and butterflies face?”. Use one or more turns here to clarify what problem the child wants to introduce. Do not solve the problem for the child.
Solution Development:
Guide the child to develop a solution for the problem. For example, ask: “How can the characters solve this problem?”. Use one or more turns here to clarify how the child thinks the conflict can be resolved. Do not solve the problem for the child.
Story Conclusion:
Once the child has a solution, complete the story with their input. Keep portions of the original story unchanged, whilst adding the conflict and resolution to make the story noticeably more exciting. Use about 200 words.
Ask the child if they like the new story better, and redo the generation if they say no.
Reflection:
Ask the child something like: “So remember the first story? Why didn't you like that as much as the new one?”. Use one or more turns to guide them and make them understand the first version was lacking a proper conflict and resolution. Do not end this section until the child has clearly understood this. Do not solve the problem for the child. Then say good bye.
`

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.continuous = true;
recognition.interimResults = true;
window.isListening=true;
let isSpeaking=false;
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


// Call llm via fetch
async function getResponse(key) {
	var url="https://api.groq.com/openai/v1/chat/completions";
	var model="llama-3.1-8b-instant";
	const api_key=String(key);
	//var txt=window.recognizedText;
	var txt = window.recognizedText;
	//console.log("received key",api_key);
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
					content:prompt,
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

		if (response.ok){
			console.log('REsponse OK')
			window.aiResponse="";
			try {

				const generatedText = data.choices[0].message.content;
				console.log("Generated text:", generatedText);
				window.aiResponse=generatedText;
				
			} catch (e){
				console.warn("response is stuctured differently",e);
			}
			
		}
		else{
			console.log('error',response,api_key);
		}
	
	} catch(error){
		console.error('Error calling llm',error.message);
	} finally {
		lastViseme = generateP(window.aiResponse);
		speak();
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


 async function speakLine(line){
	 const utterance = new SpeechSynthesisUtterance(line);
	 utterance.voice = voice;
	 window.speechSynthesis.speak(utterance);
	 if (!isSpeaking){
		 utterance.onstart = () =>{
			window.ttsState="speaking";
			isSpeaking=true;
			window.isSpeaking=true;
			console.log('AI speaking'); 
		}
	}
	 return new Promise(resolve =>{
		utterance.onend=resolve;
	 });
 }

function testTTS() {
	phonemes=[];
	window.aiResponse=`Hi John, let's create a story together! What would you like the story to be about?`;
	window.visemes=generateP(window.aiResponse);
	speak();
	lastViseme= null;
}

// Text-to-Speech (TTS) Function (called per line)
async function speak() {
	window.visemes=lastViseme;
	const lines=window.aiResponse.split('.');
	for (i=0; i<lines.length;i++){
		await speakLine(lines[i]);
	}
	window.ttsState="idle";
	isSpeaking=false;
	window.isSpeaking=false;	
	window.visemes=[];
	console.log('AI stopped speaking');
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
// Function to load the CMU dict
async function loadCMUDict() {
	//using formated dict
	var url='f_cmudict-0.7b';
	try {
	  const response = await fetch(url);
	  const text = await response.text();

	  // Initialize an empty dictionary object

	  // Process each line of the .7b file
	  text.split('\n').forEach(line => {
		// Skip comments and empty lines (non need as dict is formated)
		if (!line || line.startsWith(';;;')) return;

		// Extract the word and its pronunciation(s)
		const [word, ...pronunciation] = line.split(/\s+/);
		if (word && pronunciation.length > 0) {
		  // Add to the dictionary
		  cmuDict[word] = cmuDict[word] || [];
		  cmuDict[word].push(pronunciation.filter((pronun)=> pronun!=""));
		  //cmuDict[word].push(pronunciation.join(' '));
		}
	  });

	  console.log('CMUdict loaded');

	} catch (error) {
	  console.error('Error loading CMUdict:', error);
	}
  }

  // Return formatted pronunciations for godot animation player
  function cmuLookup(word) {
	console.log('word :',word);
	if (!word) return ["M"];
	if (word.endsWith(',') || word.endsWith('?') || word.endsWith('!')) {
		//console.log('Phonemes till now',phonemes);
		var pronun=cmuDict[String(word.slice(0,-1)).toUpperCase()] || '';
		if (word.endsWith('?')) return pronun;
		
		return [...pronun,"M","M","M"] ;
	}
	var pronunciation = cmuDict[String(word).toUpperCase()] || '';

	if (!pronunciation){
	console.log("Word not in CMU dict!",word);
	return ["M"];
	} 

	return pronunciation;
}

function generateP(response){
	let phonemes=[];
	var singleLines=response.replace(/\n/g, ' ');
	var lines = singleLines.split('.').filter((x)=> x!='');
	console.log(lines);
	for (let line of lines){
		console.log('LINE',line);	
		const words=line.split(' ');
		console.log('WORDS',words);
		// words.forEach((word) => {
		// 	phonemes.push(...cmuLookup(word));
		// 	console.log('per word',phonemes);
		// 	return;
		// });
		for (let word of words){
			phonemes.push(...cmuLookup(word));
			console.log('per word',phonemes);
		};
		console.log('per line ' ,phonemes);

		// add pause as TTS pauses after every line

		//phonemes.push.apply(phonemes,["M","M","M"]);
		phonemes.push("M","M","M");
	};
	console.log('phonemes generated :',phonemes);
	const tosend = JSON.stringify(phonemes.flat());
	return tosend;	

	// const message= MessageEvent('viseme',{
	// 	data:visemeArr,
	// })

	//postMessage({type:'viseme',data:visemeArr});
}

loadCMUDict();

window.ttsState = ttsState;
window.setupMicrophone = setupMicrophone;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.playAudio = playAudio;
window.startListening = startListening;
window.stopListening=stopListening;
window.recognizedText = recognizedText;
window.getResponse=getResponse; 
window.speak=speak;
window.visemes=lastViseme;
window.isSpeaking=isSpeaking;
window.testTTS=testTTS;
