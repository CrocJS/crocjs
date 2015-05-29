<Title:>
    Croc JS Form Example
</Title:>

<Body:>
    <div class="b-page">
        <widget is="croc.cmp.form.Form" labels="{{{position: 'left', size: '2'}}}" ddefaults="{{{size: '2'}}}">
            <passView is="body">
                <view is=":fieldset">
                    <view is=":row" size="3" label="first" hint="field hint">
                        <widget is="croc.cmp.form.field.TextField" identifier="first"
                            validation="{{{required: true, integer: true}}}">
                            <passView is="cellsBefore">
                                <view is=":cell" cls="cell_button">
                                    <widget is="croc.cmp.form.Button" class="round_left place_input size_3" text="random"
                                        on-click="setValue(_.sample(['123', '456', '789', '000']))"></widget>
                                </view>
                            </passView>
                        </widget>
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
                    
                    <view is=":row" label="Radio buttons" size="3">
                        <widget is="croc.cmp.form.field.RadioButtonsGroup" value="{{radioValue}}">
                            <passView is="items">
                                <view is=":item" text="one">
                                    <widget is="croc.cmp.form.field.RadioButton" permanentValue="1"/>
                                </view>
                                <view is=":item" text="two">
                                    <widget is="croc.cmp.form.field.RadioButton" permanentValue="2"/>
                                </view>
                                <view is=":item" text="three">
                                    <widget is="croc.cmp.form.field.RadioButton" permanentValue="3"/>
                                </view>
                            </passView>
                        </widget>
                    </view>
                    
                    <view is=":row" label="Radio buttons" labelHint="inline" size="3">
                        <widget is="croc.cmp.form.field.RadioButtonsGroup" inline="{{true}}" value="{{radioValue}}">
                            <item value="1">one</item>
                            <item value="2" checked>two</item>
                            <item value="3">three</item>
                        </widget>
                    </view>
                    
                    <view is=":row" label="Radio buttons" labelHint="inline" size="1">
                        <widget is="croc.cmp.form.field.RadioButtonsGroup" inline="{{true}}" value="{{radioValue}}"
                            items="{{[{value: '1', content: 'one'}, {value: '2', content: 'two'}, {value: '3', content: 'three'}]}}"/>
                    </view>
                    
                    <view is=":row" label="&nbsp;" hint="{{if accepted}}ok!{{else}}put the tick{{/if}}" hintState="{{accepted}}">
                        <view is="croc.cmp.form.field.CheckBox:wrapper" text="Accept!">
                            <widget is="croc.cmp.form.field.CheckBox" value="{{accepted}}" validation="{{{required: true}}}"/>
                        </view>
                    </view>
                </view>
            </passView>
            
            <passView is="buttons">
                <widget is="croc.cmp.form.Button" text="Form submit button" type="submit"></widget>
            </passView>
        </widget>
    </div>
</Body:>