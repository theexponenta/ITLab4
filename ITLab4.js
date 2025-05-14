

let _data;
let _blockSize;
let _fileType; // 0 - encoded data, 1 - decoded data
let _resultType; // 0 - encode, 1 - decode
let _lastResult;

const MAX_32BIT_INT = (~0) >>> 0;


function randInt(from, to) {
    return from + Math.floor(Math.random() * (to - from));
}


function randomBytes(count) {
    let bytes = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
        bytes[i] = randInt(0, 256);
    }

    return bytes;
}


function extractNumberFromString(str) {
    let result = "";
    for (let char of str) {
        if (char >= '0' && char <= '9')
            result += char;
    }

    if (!result)
        return null;

    return BigInt(result);
}



function fastpow(x, pow, mod) {
    let result = 1n;
    let curPow = x;

    while (pow > 0) {
        if ((pow & 1n) == 1) {
            result = (result * curPow) % mod;
        }

        curPow = (curPow * curPow) % mod;
        pow >>= 1n;
    }

    return result;
}


function isPrime(n) {
    n = Number(n);
    let sqrtN = Math.floor(Math.sqrt(n));

    for (let i = 2; i <= sqrtN; i++) {
        if (n % i == 0)
            return false;
    }

    return true;
}


function log2(n) {
    let result = 0;
    let curPow = 1n;

    while (curPow < n) {
        result++;
        curPow = curPow << 1n;
    }

    return result;
}


function hashMessage(uint8arr, q) {
    let h = 100n;
    for (let i = 0; i < uint8arr.length; i++) {
        let block = BigInt(uint8arr[i]);
        h = ((h + block) * (h + block)) % q;
    }

    return h;
}


function signMessage(data, q, p, x, k, g) {
    const result = {r: 0, s: 0, y: 0, hash: 0};
    
    result.hash = hashMessage(data, q);
    result.y = fastpow(g, x, p);
    result.r = fastpow(g, k, p) % q;
    if (result.r == 0)
        return result;

    const k_inverse = fastpow(k, q - 2n, q);
    result.s = (k_inverse * (BigInt(result.hash) + x * result.r)) % q;
    return result;
}


function checkSignature(data, q, p, g, y, r, s) {
    const result = {valid: false, v: 0, hash: 0};
    
    result.hash = hashMessage(data, q);
    const w = fastpow(s, q - 2n, q);
    const u1 = (result.hash * w) % q;
    const u2 = (r * w) % q;
    result.v = ((fastpow(g, u1, p) * fastpow(y, u2, p)) % p) % q;
    result.valid = result.v === r;
    
    return result;
}


function runSign() {
    let variablesNames = ["p", "q", "h", "x", "k"];
    let variables = {};

    for (const variable of variablesNames) {
        variables[variable] = extractNumberFromString(document.getElementById(`param_${variable}`).value);
        if (variables[variable] == null) {
            alert(`Сори гудбай! Введите ${variable}`);
            return;
        }
    }

    const q = variables.q;
    const p = variables.p;
    const h = variables.h;
    const x = variables.x;
    const k = variables.k;

    if (!isPrime(q)) {
        alert(`Сори гудбай! q - не простое`);
        return;
    }

    if (!isPrime(p)) {
        alert(`Сори гудбай! p - не простое`);
        return;
    }

    if ((p - 1n) % q != 0) {
        alert(`Сори гудбай! q не явяется делителем p - 1`);
        return;
    }
    
    if (h <= 1 || h >= (p - 1n)) {
        alert(`Сори гудбай! h должно быть в интервале (1, ${p - 1n})`);
        return;
    }

    const g = fastpow(h, (p - 1n) / q, p);

    if (g <= 1) {
        alert(`Сори гудбай! Условие h^((p-1) / q) > 1 не выполнено`);
        return;
    }

    if (x <= 0 || x >= q) {
        alert(`Сори гудбай! x должен быть в интервале (0, ${q})`);
        return;
    }

    if (k <= 0 || k >= q) {
        alert(`Сори гудбай! k должно быть в интервале (0, ${q})`);
        return;
    }

    let result = signMessage(_data, q, p, x, k, g);
    if (result.s == 0 || result.r == 0) {
        alert(`Сори гудбай! Вы лох и ничего не получилось! Введите другое k`);
        return;
    }

    _blockSize = (Math.max(log2(result.r), log2(result.s), log2(result.y), log2(p), log2(q)) + 7) >> 3;
    _lastResult = result;
    _lastResult.p = p;
    _lastResult.q = q;

    _resultType = 0;

    const y = fastpow(g, x, p);

    document.getElementById("hash").value = result.hash.toString();
    document.getElementById("signature").value = `${result.r} ${result.s}`;
    document.getElementById("param_y").value = `${y}`;
}


function runCheck() {
    const p = extractNumberFromString(document.getElementById(`param_p`).value);
    const q = extractNumberFromString(document.getElementById(`param_q`).value);
    const y = extractNumberFromString(document.getElementById(`param_y`).value);
    const h = extractNumberFromString(document.getElementById(`param_h`).value);

    if (p == null) {
        alert(`Сори гудбай! Введите p`);
        return;
    }

    if (q == null) {
        alert(`Сори гудбай! Введите q`);
        return;
    }

    if (y == null) {
        alert(`Сори гудбай! Введите y`);
        return;
    }

    if (h == null) {
        alert(`Сори гудбай! Введите h`);
        return;
    }

    if (!isPrime(q)) {
        alert(`Сори гудбай! q - не простое`);
        return;
    }

    if (!isPrime(p)) {
        alert(`Сори гудбай! p - не простое`);
        return;
    }

    if ((p - 1n) % q != 0) {
        alert(`Сори гудбай! q не явяется делителем p - 1`);
        return;
    }

    const g = fastpow(h, (p - 1n) / q, p);

    let [r, s] = document.getElementById("signature").value.trim().split(/\s+/);
    r = extractNumberFromString(r);
    s = extractNumberFromString(s);

    if (!r || !s) {
        alert(`Сори гудбай! Введите нормальную подпись`);
        return;
    }

    const result = checkSignature(_data, q, p, g, y, r, s);
    _resultType = 1;
    document.getElementById("hash").value = result.hash.toString();

    if (result.valid) {
        alert(`Подпись верна: (r == v) (${r} == ${result.v})`);
    } else {
        alert(`Подпись неверна: (r != v) (${r} != ${result.v})`);
    }
}


function run(clickEvent) {
    let result;
    if (clickEvent.target.id == "sign_button") {
    

        _resultType = 0;
    } else {


        _resultType = 1;
    }

    _lastResult = result;
}


function getDataForSign(fileReaderResult) {
    return new Uint8Array(fileReaderResult);
}


function readNumberFromUint8Arr(uint8arr, startIndex, bytesCount) {
    let endIndex = Math.min(startIndex + bytesCount, uint8arr.length);
    let num = 0n;
    let shift = 0n;
    for (let i = startIndex; i < endIndex; i++) {
        num = num | (BigInt(uint8arr[i]) << shift);
        shift += 8n;
    }

    return num;
}


function getDataToCheck(fileReaderResult) {
    let uint8arr = new Uint8Array(fileReaderResult);
    let str = String.fromCharCode(...uint8arr).trimEnd();
    /*let uint8arr = new Uint8Array(fileReaderResult);
    let blockSize = uint8arr[0];
    let r = readNumberFromUint8Arr(uint8arr, 1, blockSize);
    let s = readNumberFromUint8Arr(uint8arr, 1 + blockSize, blockSize);
    let y = readNumberFromUint8Arr(uint8arr, 1 + blockSize * 2, blockSize);
    let data = uint8arr.slice(1 + blockSize * 3);*/

    const lastLine = str.split('\n').at(-1);
    const lastLineSplitted = lastLine.split(" ");

    const r = Number(lastLineSplitted[0]);
    const s = Number(lastLineSplitted[1]);

    if (!r || !s) {
        return null;
    }

    return {data: uint8arr.slice(0, uint8arr.length - lastLine.length - 1), r, s};
}


function setDataFromFile(event) {
    let filesList = event.target.files;
    if (filesList.length == 0)
        return;

    let file = filesList[0];
    event.target.value = null;
    
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function() {
        //let textInput = document.getElementById("message");

        /*if (_fileType == 0)
            _data = getDataForSign(reader.result);
        else if (_fileType == 1) {
            let dataForCheck = getDataForCheck(reader.result);
            _data = dataForCheck.data;

            let signatureInput = document.getElementById("signature");
            let yInput = document.getElementById("y");

            signatureInput.value = `${dataForCheck.r} ${dataForCheck.s}`;
            yInput.value = `${dataForCheck.y}`;
        }*/

        let filenameLabel = document.getElementById("filename");

        if (_fileType == 0) {
            _data = new Uint8Array(reader.result);
        } else if (_fileType == 1) {
            const dataToCheck = getDataToCheck(reader.result);
            if (!signature) {
                alert("Ошибка при попытке прочитать подпись из файла");
                return;
            }

            const {data, r, s} = dataToCheck;
            const signatureInput = document.getElementById("signature");
            _data = data;
            signatureInput.value = `${r} ${s}`;
        }

        filenameLabel.innerText = file.name;

        //textInput.value = _data.join(" ");
    };
    
    reader.onerror = function() {
        console.log(reader.error);
    }
}


function writeNumberToUint8Arr(uint8arr, num, startIndex, bytesCount) {
    let endIndex = Math.min(startIndex + bytesCount, uint8arr.length);
    for (let i = startIndex; i < endIndex; i++) {
        uint8arr[i] = Number(num & 255n);
        num = num >> 8n;
    }
}


function getDataToSave() {
    let dataStr = String.fromCharCode(..._data).trimEnd();
    return `${dataStr}\n${_lastResult.r} ${_lastResult.s}`;
}


async function saveToFile() {
    let handle;
    try {
        handle = await window.showSaveFilePicker({id: 1});
    } catch(err) {
        return;
    }

    const writableStream = await handle.createWritable();

    let data;
    //if (_resultType == 0)
        data = getDataToSave();
    //else {
    //    data = new Uint8Array(_lastResult.map(Number));
    //}

    await writableStream.write(data);
    await writableStream.close();
}


document.addEventListener("DOMContentLoaded", () => {
    let signButton = document.getElementById("sign_button");
    let checkButton = document.getElementById("check_button");
    let loadFileForEncodeButton = document.getElementById("load_from_file_for_encode");
    let loadFileForDecodeButton = document.getElementById("load_from_file_for_decode");
    let fileInput = document.getElementById("file_input");
    let saveToFileButton = document.getElementById("save_to_file");

    signButton.addEventListener("click", runSign);
    checkButton.addEventListener("click", runCheck);
    loadFileForEncodeButton.addEventListener("click", () => {_fileType = 0; fileInput.click()});
    loadFileForDecodeButton.addEventListener("click", () => {_fileType = 1; fileInput.click()});
    fileInput.addEventListener("change", setDataFromFile);
    saveToFileButton.addEventListener("click", saveToFile);
});
