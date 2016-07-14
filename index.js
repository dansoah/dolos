"use strict";

const fs = require('fs');
const Q = require('q');

const image_path = process.argv[2];

/*
 * Will open the file and return a promise containing an error or
 * a file read stream
 */
function openFileForReading(file_path){
    const deferred = Q.defer();
    fs.open(file_path, 'r', (error, file) => {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve(file);
        }
    });
    return deferred.promise;
}

function getByteBuffer(file,offset,length,position){

    const deferred = Q.defer();
    let buffer = new Buffer(length);
    fs.read(file,buffer,offset,length,position, (err,data) => {
        if(err)
            return deferred.reject(new Error(err));

        return deferred.resolve(buffer);
    })

    return deferred.promise;

}

function getHexBytesFromFile(file,offset,length,position){
    const deferred = Q.defer();

    getByteBuffer(file,offset,length,position).then( (buffer) => {
        let data = [];
        for(let value of buffer.values()){
            value = value.toString(16);
            value = value.length == 1 ? "0"+value : value;

            data.push(value.toUpperCase());
        }
        return deferred.resolve(data);
    })

    return deferred.promise;
}

function getAsciiBytesFromFile(file,offset,length,position){
    const deferred = Q.defer();

    getByteBuffer(file,offset,length,position).then( (buffer) => {
        let data = [];
        for(let value of buffer.values()){
            let character = String.fromCharCode(value)

            data.push(character);
        }
        return deferred.resolve(data);
    })

    return deferred.promise;
}

function checkForPngSignature(file){
    const deferred = Q.defer();
    const signature_bytes = [
        '89', // Non Ascii (I have any idea of what is it)
        '50', // P
        '4E', // N
        '47', // G
        '0D', // \r
        '0A', // \n
        '1A', // \u001a (Substitute char)
        '0A'  // \n
    ];
    getHexBytesFromFile(file,0,8,0)
        .then((bytes) => {
            let is_png = bytes
                            .map( (byte,i) => byte === signature_bytes[i])
                            .filter( (is_equals) => is_equals === false)
                            .length == 0

            return deferred.resolve(is_png);
        })
        .catch( (err) => {
            return deferred.reject(new Error(err));
        })

    return deferred.promise;
}

function PngHandler(_file){
    const file = _file;

    this.getChunks = function(){
        return "there's a lot of chunks";
    }
}

function getFileHandler(file){

    const deferred = Q.defer();

    checkForPngSignature(file).then( (is_png) => {
        return deferred.resolve(new PngHandler(file));
    })

    return deferred.promise;
}



function injectData(handler){
    console.log("ok",handler);
    console.log(handler.getChunks());
}
openFileForReading(image_path)
    .then(getFileHandler)
    .then(injectData)
