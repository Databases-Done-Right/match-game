const hamButton = document.querySelector('#menu');
const navigation = document.querySelector('nav > ul');

hamButton.addEventListener('click', () => {
	navigation.classList.toggle('open');
	hamButton.classList.toggle('open');
//    if(hamButton.classList.contains('open')) {
        //navigation.
    //}
});