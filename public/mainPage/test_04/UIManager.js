class UIManager{
    setText(id,text){
        document.getElementById(id).textContent = text;
    }

    disableBtn(id){
        document.getElementById(id).disable = true;
    }
}
