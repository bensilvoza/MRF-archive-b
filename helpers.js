
//IID
function iid (){
	var id = ""

	//abc123
	var letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k",
	               "l", "m", "n", "o", "p", "q", "r", "s", "t", "w", "x",
	              "y", "z"]
	
	var numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
	
	//letters
	for (var i = 0; i < 4; i++){
         var randomNumber = Math.floor (Math.random() * 24)
         id = id + letters[randomNumber].toUpperCase()
	}

	//numbers
	for (var i = 0; i < 4; i++){
         var randomNumber = Math.floor (Math.random() * 9)
         id = id + numbers[randomNumber]
	}
	
	return id
}





//SECURE PASSWORD
//salting
function salting (password){
    var characters = ["@", "!", "*", "%", "5", "8", "0", "7", "s", "j"]

    var subtract = password.length - 1
    var add = subtract + 6

    var index = 0
    var runner = 0
    while (runner <= add){
        if (runner >= subtract + 1){
            password = password + characters[index]
        }
         
        if (index === 9) index = -1

        index++
        runner++ 
    }

    return password
}


//hashing
function hashing (password){

   //call salting
   var s = salting (password)

   //hash
   var hash = ""

   for (var i = 0; i < s.length; i++){
        var index = 0
        var code = s[i].charCodeAt(index)

        //add them up
        hash = hash + s[i]
        hash = hash + code
   }

   return hash
}







//EXPORT
module.exports.iid = iid;

module.exports.hashing = hashing;




