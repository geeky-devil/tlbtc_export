
let sampletext=`My name is Optimus Prime, and I need help.
The autobots have gone missing.`
let sampletext2=`You know what's near the sky? The gate we're trying to get through. Do you think our sleepy monster friend might know why the sky is blue? Want to tell it a story about the sky instead? What would you like the story to be about?`;
let sampletext3=`Hi Jack, let's create a story together. What would you like our story to be about? Don't worry if you need a little time to think, I'm excited to hear your ideas.`;
let emotion = 'Neutral';
let state = 0;
let prompt=`You are playing through this Story Creation Activity with a 5 year old child. Respond as if you are having an actual, verbal chat with the child - make it humorous, not textbook like, and do not use things like actions or emojis. Whenever you ask questions, ask succinctly, and never follow one question with another suggestive question. Say less, and let the child explore more. If the child says something inappropriate (for example, sexual, violent, criminal or off topic), deflect and repeat your question.
Each part the activity has a state which is mentioned within a square bracket [] adjacent to the activity name.
The activity should go like this:
Introduction [0]:
Start by asking the child for their name.
Then, begin the activity by saying something like: “Hi <name>, let’s create a story together! What would you like the story to be about?”
Initial Setting and Plot [1]:
Once the child provides a topic, ask them for a setting (if not covered by the topic). Then, ask them for a hero (if not covered by the topic).
Next, create a bland story based on these, making sure the story doesn't have a conflict or climax. Use about 100 words.
End the story with "The End", and ask the child if they think it is a good story.
Assessment and Problem Identification [2]:
If the child says it’s great, guide them to see that the story might need a conflict. For example, ask: “Do you think there’s something missing that could make it more interesting?”. Use one or more turns here to make sure the child understands. Do not solve the problem for the child.
Introduce a Problem:
Help the child introduce a conflict into the story. For example, if the story is about animals and butterflies, you could ask: “What problem could the animals and butterflies face?”. Use one or more turns here to clarify what problem the child wants to introduce. Do not solve the problem for the child.
Solution Development:
Guide the child to develop a solution for the problem. For example, ask: “How can the characters solve this problem?”. Use one or more turns here to clarify how the child thinks the conflict can be resolved. Do not solve the problem for the child.
Story Conclusion[3]:
Once the child has a solution, complete the story with their input. Keep portions of the original story unchanged, whilst adding the conflict and resolution to make the story noticeably more exciting. Use about 200 words.
Ask the child if they like the new story better, and redo the generation if they say no.
Reflection [4]:
Ask the child something like: “So remember the first story? Why didn't you like that as much as the new one?”. Use one or more turns to guide them and make them understand the first version was lacking a proper conflict and resolution. Do not end this section until the child has clearly understood this. Do not solve the problem for the child. Then say good bye.
End [5]:
When the child says Goodbye or the conversation has ended.

Here is a sample :
They Encounter a Monster and Must Make It Sleep by Telling It a Good Story to Come Through the Gate- Tone: Calm and encouraging, making the monster sound silly rather than scary.
AI (whispering, smiling):- “Shhh… looks like we’ve got a sleepy monster here! It won’t let us through the gate until it hears a good story. Think you can help it drift off to dreamland?”
Child Responses & AI Reactions:
1. Child: “Once upon a time…”- AI (listening intently, eyes wide with interest): “Ohh, good start! Keep going; I think it’s getting sleepy…”
2. Child: “I don’t know a story.”- AI (gentle encouragement): “How about something silly? Maybe about a jungle full of animals who love to dance?”
3. Child: “Can you tell the story?”- AI (smiling warmly): “Alright, I’ll help you start. Let’s make up something fun together!”

Express an emotion per response
Use the following emotions only.
[Neutral,Happy,Angry,Surprised]

Provide the response in JSON format as follows:
{'emotion':'happy','text':'Hi there.','state': 0}
`

let prompt2=`You are having a  casual conversation with a child. You ask simple question and express emotions based on the child's responses.  Begin your response with your emotion within {}. If there are multiple emotions,split the responses into lines making sure emotions stay at the beginning.
Use the following following expressions : Excitement , Happiness , Curious, Sad , Angry.`;

const models=['llama3-70b-8192','llama-3.1-8b-instant','llama3-8b-8192'];
let msgs=[
	{
		role:"system",
		content:prompt
	}
];


// Call llm via fetch
async function getResponse(key) {
	var url="https://api.groq.com/openai/v1/chat/completions";
	var model=models[0];
	const api_key=String(key);
	//var txt=window.recognizedText;
	var txt = window.recognizedText;
	msgs.push({role:"user", content:txt});
	//console.log("received key",api_key);
	try {
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${api_key}`,
			'Connection':'keep-alive',
			'Cache-Control': 'max-age=1000',
			'Access-Control-Max-Age':3000,
			'Max-Age':4000,
		},
		body: JSON.stringify({
			model:model,
			messages:msgs,
			max_tokens:1024,
			response_format:{"type": "json_object"},
			stream:false,
		})
	});
		const data = await response.json();

		if (response.ok){
			console.log('Response OK')
			window.aiResponse="";
			try {
				const message= data.choices[0].message;
				console.log(message);
				const generatedJson = JSON.parse(data.choices[0].message.content);
				console.log("Generated text:", generatedJson);
				window.aiResponse=generatedJson.text;
				emotion=generatedJson.emotion;
				state=generatedJson.state;
				window.state=state;
				console.log('emotion',emotion);
				console.log('text',window.aiResponse);
				console.log('state',generatedJson.state);
				msgs.push({role:"assistant",content:window.aiResponse});
				
			} catch (e){
				console.warn("response is stuctured differently",e);
			}
			
		}
		else{
			console.log('error');
		}
	
	} catch(error){
		console.error('Error calling llm',error.message,window.recognizedText);
	} finally {
		//window.aiResponse=window.aiResponse.replace(/[?!]/g, '.');
		generateSpeech(window.aiResponse);		
		
	}
}

function extractEmotion(text) {
	const emotionPattern = /^{(\w+)}\s*/; // Matches text starting with {emotion}
	const match = text.match(emotionPattern);
  
	if (match) {
	  emotion = match[1]; // Extracted emotion
	  const strippedText = text.replace(emotionPattern, ''); // Remove emotion from text
	  return strippedText;
	}
	emotion ='Neutral';
  
	return text; // No emotion found
  }
  
window.getResponse=getResponse; 

function testTTS(text){
	generateSpeech(text);
}

function chat(text){
	window.recognizedText=text;
	getResponse('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');
}