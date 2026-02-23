Add-Type -AssemblyName System.Speech

try {
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizer.SetInputToDefaultAudioDevice()

    $choices = New-Object System.Speech.Recognition.Choices
    $choices.Add("hello jarvis")
    $choices.Add("hey jarvis")
    $choices.Add("jarvis")
    $choices.Add("wake up jarvis")

    $grammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
    $grammarBuilder.Append($choices)
    $grammar = New-Object System.Speech.Recognition.Grammar($grammarBuilder)

    $recognizer.LoadGrammar($grammar)

    Register-ObjectEvent -InputObject $recognizer -EventName SpeechRecognized -Action {
        # Lower confidence threshold (default requires very clear pronunciation)
        if ($EventArgs.Result.Confidence -gt 0.4) {
            # Play a soft system beep so the user knows it heard them without relying on Node
            [System.Console]::Beep(600, 150)
            [System.Console]::Beep(800, 200)

            [Console]::Out.WriteLine("WAKE_WORD_DETECTED")
            [Console]::Out.Flush()
        }
        else {
            # If confidence is too low, print it out so we can debug
            [Console]::Out.WriteLine("LOW_CONFIDENCE_WAKE: $($EventArgs.Result.Confidence)")
            [Console]::Out.Flush()
        }
    }

    [Console]::Out.WriteLine("LISTENER_READY")
    [Console]::Out.Flush()

    $recognizer.RecognizeAsync("Multiple")

    while ($true) { 
        Start-Sleep -Seconds 1 
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}
