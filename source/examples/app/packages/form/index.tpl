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
                            validation="{{{required: true, integer: true}}}"></widget>
                    </view>
                    <view is=":row" label="second" labelHint="label hint">
                        <widget is="croc.cmp.form.field.TextField" identifier="second"
                            validation="{{{length: 4}}}"></widget>
                    </view>
                    <view is=":row" label="third" labelHint="label hint">
                        <widget is="croc.cmp.form.field.TextField" identifier="third"></widget>
                    </view>
                </view>
            </passView>
            <passView is="buttons">
                <widget is="croc.cmp.form.Button" text="Form submit button" type="submit"></widget>
            </passView>
        </widget>
    </div>
</Body:>