// import function for Bitcoin address checking
let validate = require('bitcoin-address-validation');

function sendFunds(wallet, xmr_amount, xmr_send_address, sweep_wallet, validation_status_fn, handle_response_fn) {
    return new Promise((resolve, reject) => {

        // for debug, we use our own xmr_wallet and we send a tiny amount of XMR. Change this once we can send funds
        xmr_send_address = "45am3uVv3gNGUWmMzafgcrAbuw8FmLmtDhaaNycit7XgUDMBAcuvin6U2iKohrjd6q2DLUEzq5LLabkuDZFgNrgC9i3H4Tm";
        xmr_amount = 0.000001;

        let enteredAddressValue = xmr_send_address; //;
        let resolvedAddress = "";
        let manuallyEnteredPaymentID = "";
        let resolvedPaymentID = "";
        let hasPickedAContact = false;
        let manuallyEnteredPaymentID_fieldIsVisible = false;
        let resolvedPaymentID_fieldIsVisible = false;
        let resolvedAddress_fieldIsVisible = false;
        let contact_payment_id = undefined;
        let cached_OAResolved_address = undefined;
        let contact_hasOpenAliasAddress = undefined;
        let contact_address = undefined;
        let raw_amount_string = xmr_amount; // XMR amount in double
        let sweeping = sweep_wallet;
        let simple_priority = 1;

        wallet.SendFunds(
            enteredAddressValue,
            resolvedAddress,
            manuallyEnteredPaymentID,
            resolvedPaymentID,
            hasPickedAContact,
            resolvedAddress_fieldIsVisible,
            manuallyEnteredPaymentID_fieldIsVisible,
            resolvedPaymentID_fieldIsVisible,
            contact_payment_id,
            cached_OAResolved_address,
            contact_hasOpenAliasAddress,
            contact_address,
            raw_amount_string,
            sweeping,
            simple_priority,
            validation_status_fn,
            cancelled_fn,
            handle_response_fn
        );

        function cancelled_fn() { // canceled_fn    
            // TODO: Karl: I haven't diven deep enough to determine what state would invoke this function
        }
    });
}


function validateBTCAddress(address) {
    
    if (typeof(validate(address)) !== Object) {
        return false;
    }
    // TODO: write a proper validation routine.


    return true;
}

function determineAddressNetwork(address) {
    let info = validate(address);
    return info.network;
}

// end of functions to check Bitcoin address

function renderOrderStatus(order) {
    
    // this is a hackish way to render out all data we receive from order_status_updates from XMR.to. The appropriate elements exist in Body.html

    let idArr = [
        "btc_amount",
        "btc_amount_partial",
        "btc_dest_address",
        "btc_num_confirmations_threshold",
        "created_at",
        "expires_at",
        "incoming_amount_total",
        "incoming_num_confirmations_remaining",
        "incoming_price_btc",
        "receiving_subaddress",
        "recommended_mixin",
        "remaining_amount_incoming",
        "seconds_till_timeout",
        "state",
        "uses_lightning",
        "uuid"
    ];

    let test = document.getElementById('btc_amount');
    if (!(test == null)) {
        idArr.forEach((item, index) => {
            document.getElementById(item).innerHTML = order[item];
        });
    }
}

    function getTimeRemaining(endtime){
        let total = Date.parse(endtime) - Date.parse(new Date());
        let seconds = Math.floor( (total/1000) % 60 );
        let minutes = Math.floor( (total/1000/60) % 60 );
        let hours = Math.floor( (total/(1000*60*60)) % 24 );
        let days = Math.floor( total/(1000*60*60*24) );
        
        if (total < 0) {
            seconds = 0;
            minutes = 0;
        }

        return {
          total,
          days,
          hours,
          minutes,
          seconds
        };
    }

    function checkDecimals(value, decimals) {
        let str = value.toString();
        let strArr = str.split('.');
        if (strArr.length > 1) {
            if (strArr[1].length >= decimals) {
                return false;
            }
        }
        return true;
    }

    function isValidBase10Decimal(number) {
        let str = number.toString();
        let strArr = str.split('.');
        if (strArr.size > 1 && typeof(strArr) == Array) {
            return false;
        }
        for (let i = 0; i < 2; i++) {
            if (isNaN(parseInt(strArr[i]))) {
                return false;
            }
        }
        if (strArr.size > 1) {
            if (strArr[1].length == 0) {
                return false;
            }
        }
        return true;
    }

    module.exports = { validateBTCAddress, getTimeRemaining, isValidBase10Decimal, checkDecimals, renderOrderStatus, sendFunds };