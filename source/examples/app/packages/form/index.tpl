<Title:>
    Croc JS Form Example
</Title:>

<Body:>
    <div class="b-page">
        {{client}}
            <widget is="croc.cmp.form.Form" labels="{{{position: 'left', size: '2'}}}" ddefaults="{{{size: '2'}}}">
                <passView is="body">
                    <view is=":fieldset">
                        <view is=":row" size="3" label="first" hint="field hint">
                            <widget is="croc.cmp.form.field.TextField" identifier="first"
                                validation="{{{required: true, integer: true}}}"></widget>
                        </view>
                        
                        <view is=":row" label="second" labelHint="digits only">
                            <widget is="croc.cmp.form.field.TextField" identifier="second" transformOnUpdate="digitsOnly"
                                validation="{{{length: 4}}}" instantValue="{{_myValue}}"/>
                        </view>
                        
                        <view is=":row" label="third">
                            <widget is="croc.cmp.form.field.TextField" identifier="third" password="{{true}}" masked="{{passField}}"
                                instantValue="{{_myValue}}"></widget>
                            <labelHint>
                                <span class="g-pseudo" on-click="toggle($at(passField))"><span class="g-pseudo-h">password: {{if passField}}on{{else}}off{{/if}}</span></span>
                            </labelHint>
                        </view>
                        
                        <view is=":row" label="Password">
                            <widget is="croc.cmp.form.field.PasswordField"/>
                        </view>
                        
                        <view is=":row" label="TextArea" hint="length is {{textAreaContent.length}}">
                            <widget is="croc.cmp.form.field.TextArea" instantValue="{{textAreaContent}}"/>
                        </view>
                        
                        <view is=":row" label="&nbsp;" hint="{{if accepted}}ok!{{else}}put the tick{{/if}}" hintState="{{accepted}}">
                            <view is="croc.cmp.form.field.CheckBox:wrapper" text="Accept!">
                                <widget is="croc.cmp.form.field.CheckBox" value="{{accepted}}"/>
                            </view>
                        </view>
                    </view>
                </passView>
                
                <passView is="buttons">
                    <widget is="croc.cmp.form.Button" text="Form submit button" type="submit"></widget>
                </passView>
            </widget>
        {{/client}}
    </div>
</Body:>