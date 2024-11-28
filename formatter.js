var formatedDict={}
async function loadCMUDict() {
	var url='cmudict-0.7b';
	try {
	  const response = await fetch(url);
	  const text = await response.text();

	  // Initialize an empty dictionary object
	  const cmuDict = {};

	  // Process each line of the .7b file
	  text.split('\n').forEach(line => {
		// Skip comments and empty lines
		if (!line || line.startsWith(';;;')) return;

		// Extract the word and its pronunciation(s)
		const [word, ...pronunciation] = line.split(/\s+/);
		if (word && pronunciation.length > 0) {

            const formattedPronun= format(pronunciation);
		  // Add to the dictionary
		  //cmuDict[word] = cmuDict[word] || [];
		  //cmuDict[word].push(pronunciation.join(' '));
          cmuDict[word].push(formattedPronun);
		}
	  });

	  console.log('CMUdict loaded ');
      window.formatedDict=formatedDict;

	} catch (error) {
	  console.error('Error loading CMUdict:', error);
	}
  }

function format(pronun){
var phonemes=pronun.split(' ');
phonemes.forEach(phoneme => {
    if (phoneme.endsWith('0') || phoneme.endsWith('1') || phoneme.endsWith('2')){
    var stress_num=phoneme.charAt(phoneme.length-1);
    phoneme=phoneme.slice(0,-1);
    formattedPhonemes.push(phoneme);
    switch(stress_num){
        case '1':
            formattedPhonemes.push(phoneme);
            return formattedPhonemes;
        case '2' :
            formattedPhonemes.push(phoneme);
            return formattedPhonemes;
        }
    }
    else{
        formattedPhonemes.push(phoneme);
        return formattedPhonemes;
    }
});
}