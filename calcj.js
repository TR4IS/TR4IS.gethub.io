const display = document.getElementById("display");

function SendTo(input){

    display.value += input;

}

function Clear(){

    display.value = "";

}

function Equals(){
try{
    display.value = eval(display.value);
}catch(error){
    display.value = "ERORR!"
}
}
