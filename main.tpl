<Page:>
    <!DOCTYPE html>
    <html class="l-html" id="nojs">
        <head>
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
            <meta name="viewport" content="width = device-width, initial-scale = 1.0">
            <script>document.documentElement.id = 'js';</script>
            
            <view name="{{$render.prefix}}TitleElement"></view>
            <view name="{{$render.prefix}}StylesLinks" optional></view>
            <view name="{{$render.prefix}}Styles"></view>
            <view name="{{$render.prefix}}Head" optional></view>
        </head>
        <view name="{{$render.prefix}}BodyElement"></view>
    </html>
</Page:>

<BodyServer:>
    <!--{{!desktop}}
        <script src="/d/js/hammer/hammer.js"></script>
    {{/!desktop}}-->
    __DERBY_BUNDLE__
    <view name="{{$render.prefix}}AppScript"></view>
    <view name="{{$render.prefix}}Tail"></view>
</BodyServer:>