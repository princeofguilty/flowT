const order_options = ['Manual', 'Startup', 'On Previous Success']

function create_orderbox(id) {
    const options = document.createElement('select');
    options.contentEditable = false;
    options.id = "order"+id;
    order_options.forEach((optionText, index) => {
        const new_option = document.createElement('option');
        new_option.value = index + 1;
        new_option.text = optionText;
        options.add(new_option);
    });

    return options;
}

export default { create_orderbox };