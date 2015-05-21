<Title:>
    Croc JS Form Example
</Title:>

<Body:>
    <div class="b-page">
        <widget is="croc.cmp.form.Form">
            <passView is="body">
                <view is=":fieldset">
                    <view is=":row" size="3" label="first" hint="field hint">
                        <widget is="croc.cmp.form.field.TextField" identifier="first"
                            validation="{{{required: true, integer: true}}}"></widget>
                    </view>
                    <view is=":row" size="2" label="second">
                        <widget is="croc.cmp.form.field.TextField" identifier="second"
                            validation="{{{length: 4}}}"></widget>
                    </view>
                </view>
            </passView>
            <passView is="buttons">
                <widget is="croc.cmp.form.Button" text="Form submit button" type="submit"></widget>
            </passView>
        </widget>
    </div>
</Body:>