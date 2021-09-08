module Main exposing (main)

import Browser
import Html exposing (Html, button, div, h1, h2, text)
import Html.Attributes exposing (style)
import Html.Events exposing (onClick)
import Html.Lazy exposing (lazy)


main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


type Msg
    = Increment
    | LazyIncrement


type alias Model =
    { clickCount : Int, lazyCount : Int }


init : () -> ( Model, Cmd Msg )
init flags =
    ( { clickCount = 0, lazyCount = 0 }, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment ->
            ( { model | clickCount = model.clickCount + 1 }, Cmd.none )

        LazyIncrement ->
            ( { model | lazyCount = model.lazyCount + 1 }, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none


renderLazy : Int -> Html Msg
renderLazy lazyCount =
    h2 [] [ text ("This click count is rendered lazily: " ++ String.fromInt lazyCount) ]


view : Model -> Html Msg
view model =
    div [ style "padding" "32px" ]
        [ h1 []
            [ text "Hello, from Main.elm!" ]
        , button
            [ onClick Increment, style "padding" "8px", style "marginRight" "8px" ]
            [ text "Normal button" ]
        , button
            [ onClick LazyIncrement, style "padding" "8px" ]
            [ text "Lazy button" ]
        , h2 [] [ text ("You have clicked the normal button " ++ String.fromInt model.clickCount ++ " times!") ]
        , lazy renderLazy model.lazyCount
        ]
