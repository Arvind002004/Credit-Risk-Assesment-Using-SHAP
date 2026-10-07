document.getElementById('prediction-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // DOM UI elements
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.querySelector('.btn-text');
    const radar = document.getElementById('radar');
    
    // Status visual fields
    const statusTag = document.getElementById('status-tag');
    const metaStatus = document.getElementById('meta-status');
    const metaThresh = document.getElementById('meta-thresh');
    const scoreVal = document.getElementById('score-val');
    const riskAlert = document.getElementById('risk-alert');
    const riskTitle = document.getElementById('risk-grade-title');
    const riskDesc = document.getElementById('risk-grade-desc');

    // Gauge Needle & SVG Stroke Elements
    const gaugeNeedle = document.getElementById('gauge-needle');
    const gaugeFill = document.getElementById('gauge-fill');

    // Enable loader, Radar, visual scanning feedback state
    btnText.textContent = "AI Scanning...";
    submitBtn.disabled = true;
    radar.classList.add('active');
    
    statusTag.textContent = "analyzing";
    metaStatus.textContent = "Processing";
    metaStatus.className = "meta-value id-pulsing meta-scanning";

    // Dynamic Scanning needle sweep effect
    let progress = 0;
    const interval = setInterval(() => {
        const randomScore = Math.random() * 100;
        // sweep needle around loosely to show "working" simulation logic
        const angle = -90 + (randomScore * 1.8); 
        gaugeNeedle.style.transform = `rotate(${angle}deg)`;
        scoreVal.textContent = `${randomScore.toFixed(1)}%`;
    }, 85);

    // Collect Input fields
    const data = {
        person_age: parseInt(document.getElementById('person_age').value),
        person_income: parseFloat(document.getElementById('person_income').value),
        person_home_ownership: document.getElementById('person_home_ownership').value,
        person_emp_length: parseFloat(document.getElementById('person_emp_length').value),
        loan_intent: document.getElementById('loan_intent').value,
        loan_grade: document.getElementById('loan_grade').value,
        loan_amnt: parseFloat(document.getElementById('loan_amnt').value),
        loan_int_rate: parseFloat(document.getElementById('loan_int_rate').value),
        loan_percent_income: parseFloat(document.getElementById('loan_percent_income').value),
        cb_person_cred_hist_length: parseInt(document.getElementById('cb_person_cred_hist_length').value),
        cb_person_default_on_file: document.getElementById('cb_person_default_on_file').value
    };

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("API Connection Error");

        const result = await response.json();
        
        // Ensure accurate prediction processing
        const finalProb = result.default_probability * 100;
        const threshold = result.threshold;

        // Clear scanning interval with delay
        setTimeout(() => {
            clearInterval(interval);
            
            // Animation values based on predictions 
            // -90deg is 0% risk, +90deg is 100% risk. Formula: -90 + (Prob % * 1.8)
            const needleAngle = -90 + (finalProb * 1.8);
            gaugeNeedle.style.transform = `rotate(${needleAngle}deg)`;
            
            // Animate SVG stroke arc path
            // Max gauge dashoffset value logic (SVG total dash length is ~251)
            const arcOffset = 251 - ((finalProb / 100) * 251);
            gaugeFill.style.strokeDashoffset = arcOffset;

            // Animate Risk Score output display accurately counter upwards
            animateValue(scoreVal, parseFloat(scoreVal.textContent), finalProb, 800);

            // Set final alert thresholds, UI tag results, styles
            metaThresh.textContent = threshold.toFixed(4);
            statusTag.textContent = "complete";
            metaStatus.textContent = "Analyzed";
            metaStatus.className = "meta-value id-pulsing meta-active";

            if (result.Result === 'High Risk') {
                riskAlert.className = "status-alert danger-state";
                riskTitle.textContent = "⚠️ HIGH RISK APPLICANT";
                riskDesc.textContent = `Alert: This applicant exceed risk threshold of ${threshold}. Standard system protocol flags high probability of defaults.`;
            } else {
                riskAlert.className = "status-alert success-state";
                riskTitle.textContent = "✅ LOW RISK APPLICANT";
                riskDesc.textContent = `Approval Validated. Applicant shows excellent solvency credit profile within target safe parameters.`;
            }

            // Normal button & radar cleanups
            btnText.textContent = "Analyze Risk";
            submitBtn.disabled = false;
            radar.classList.remove('active');

        }, 1200); // 1.2 second simulated machine scan (visually high quality state)

    } catch (error) {
        clearInterval(interval);
        console.error('Submission Error:', error);
        alert("Server request failed. Please check endpoint API state.");
        
        // Reset system to normal default/standby state
        btnText.textContent = "Analyze Risk";
        submitBtn.disabled = false;
        radar.classList.remove('active');
        statusTag.textContent = "error";
        metaStatus.textContent = "Standby";
        metaStatus.className = "meta-value id-pulsing";
        gaugeNeedle.style.transform = "rotate(-90deg)";
        gaugeFill.style.strokeDashoffset = "251";
        scoreVal.textContent = "0.0%";
    }
});

// Counter visual logic for score display digit scroll state animations
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = `${(progress * (end - start) + start).toFixed(1)}%`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}