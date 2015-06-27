<Title:>
    Croc JS Examples
</Title:>

<Body:>
    {{client}}
    <div class="b-page">
        
        {{each _page.attrs as #attr, #i}}
            <p>
                name: <input value="{{#attr[0]}}">, value: <input value="{{#attr[1]}}"> <button on-click="removeAttr(#i)">Remove attribute</button>
            </p>
        {{/each}}
        <button on-click="addAttr()">Add attribute</button>
        
        <br><br>
        <div data-style="{{_page.attrsObj.style}}" attributes="{{_page.attrsObj, {'data-a': 'b'}}}">Test div</div>
        <br>
        {{JSON.stringify(_page.attrsObj)}}
        <br>
        <div attributes="{{JSON.stringify(_page.attrsObj)}}">Div with "attributes" attribute</div>
    
    </div>
    {{/client}}
</Body:>