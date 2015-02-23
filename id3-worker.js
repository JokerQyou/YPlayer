importScripts('id3-minimized.js');
fs = [], result = [];
onmessage = function(e){
    fs = e.data.files;
    var _t = function(_urn, _f, _result, _fs){
        ID3.loadTags(
            _urn, 
            function(){
                var tags = ID3.getAllTags(_urn);
                for(var k in tags){
                    var tag = tags[k];
                    if(k == 'picture'){
                        var img = tags[k], 
                            b64str = '';
                        for(var i = 0, l = img.data.length; i < l; i ++){
                            b64str += String.fromCharCode(img.data[i]);
                        }
                        tags[k] = b64str;
                        tags['picture_format'] = img.format;
                        continue;
                    }
                    if(typeof tag == 'object'){
                        if(tag.constructor.name == 'String'){
                            tags[k] = tag.toString();
                        }else{
                            delete tags[k];
                        }
                    }
                };
                tags.filename = _urn;
                _result.push(tags);
                if(_result.length == _fs.length){
                    postMessage(_result);
                }
            }, 
            {
                tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"], 
                dataReader: FileAPIReader(_f)
            }
        );
    };
    for (var i = fs.length - 1; i >= 0; i--) {
        var f = fs[i], 
            urn = f.name;
        _t(urn, f, result, fs);
    };
};
